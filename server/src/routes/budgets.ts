// Budget routes — the money trail. Every dollar, every department, every year.
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { validate } from "../middleware/validate";

const router = Router();

// GET /api/cities/:cityId/budgets — all budget years for a city
const cityParamsSchema = z.object({ cityId: z.string().uuid() });
const budgetQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2030).optional(),
});

router.get(
  "/cities/:cityId/budgets",
  validate({ params: cityParamsSchema, query: budgetQuerySchema }),
  async (req: Request, res: Response) => {
    const { cityId } = req.params;
    const { year } = req.query as unknown as z.infer<typeof budgetQuerySchema>;

    const where: any = { cityId };
    if (year) where.fiscalYear = year;

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { fiscalYear: "desc" },
      select: {
        id: true,
        fiscalYear: true,
        totalRevenue: true,
        totalExpenses: true,
        departments: true,
        sourceUrl: true,
        sourceType: true,
        ingestedAt: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    const serialized = budgets.map((b) => ({
      ...b,
      totalRevenue: b.totalRevenue.toString(),
      totalExpenses: b.totalExpenses.toString(),
    }));

    logger.info("Budgets fetched", { cityId, year, count: budgets.length });
    res.json({ data: serialized });
  }
);

// GET /api/budgets/:id — single budget with full department breakdown
const budgetParamsSchema = z.object({ id: z.string().uuid() });

router.get(
  "/budgets/:id",
  validate({ params: budgetParamsSchema }),
  async (req: Request, res: Response) => {
    const budget = await prisma.budget.findUnique({
      where: { id: req.params.id },
      include: { city: { select: { name: true, state: true } } },
    });

    if (!budget) {
      res.status(404).json({ error: "Budget not found" });
      return;
    }

    res.json({
      data: {
        ...budget,
        totalRevenue: budget.totalRevenue.toString(),
        totalExpenses: budget.totalExpenses.toString(),
      },
    });
  }
);

// POST /api/budgets/ingest — ingest budget data for a city
// This is the pipeline entry point. Takes structured JSON, stores it.
const ingestSchema = z.object({
  cityId: z.string().uuid(),
  fiscalYear: z.number().int().min(2000).max(2030),
  totalRevenue: z.number().int().positive(), // in cents
  totalExpenses: z.number().int().positive(),
  departments: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().int(), // in cents
      category: z.string().optional(),
    })
  ),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["pdf", "csv", "api", "manual"]).optional(),
});

router.post(
  "/budgets/ingest",
  validate({ body: ingestSchema }),
  async (req: Request, res: Response) => {
    const data = req.body as z.infer<typeof ingestSchema>;

    // Verify city exists
    const city = await prisma.city.findUnique({ where: { id: data.cityId } });
    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    // Upsert — if we re-ingest the same year, update it
    const budget = await prisma.budget.upsert({
      where: {
        cityId_fiscalYear: { cityId: data.cityId, fiscalYear: data.fiscalYear },
      },
      create: {
        cityId: data.cityId,
        fiscalYear: data.fiscalYear,
        totalRevenue: BigInt(data.totalRevenue),
        totalExpenses: BigInt(data.totalExpenses),
        departments: data.departments as any,
        sourceUrl: data.sourceUrl,
        sourceType: data.sourceType,
      },
      update: {
        totalRevenue: BigInt(data.totalRevenue),
        totalExpenses: BigInt(data.totalExpenses),
        departments: data.departments as any,
        sourceUrl: data.sourceUrl,
        sourceType: data.sourceType,
      },
    });

    logger.info("Budget ingested", {
      cityId: data.cityId,
      fiscalYear: data.fiscalYear,
      cityName: city.name,
    });

    res.status(201).json({
      data: {
        ...budget,
        totalRevenue: budget.totalRevenue.toString(),
        totalExpenses: budget.totalExpenses.toString(),
      },
    });
  }
);

export default router;
