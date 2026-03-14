// City routes — CRUD for cities and the report card data
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { validate } from "../middleware/validate";

const router = Router();

// GET /api/cities — list all cities, optionally filter by state
const listQuerySchema = z.object({
  state: z.string().length(2).toUpperCase().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/", validate({ query: listQuerySchema }), async (req: Request, res: Response) => {
  const { state, page, limit } = req.query as unknown as z.infer<typeof listQuerySchema>;

  const where = state ? { state } : {};
  const [cities, total] = await Promise.all([
    prisma.city.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        state: true,
        population: true,
        grade: true,
        responseRate: true,
        avgResolveDays: true,
        lastGradedAt: true,
      },
    }),
    prisma.city.count({ where }),
  ]);

  logger.info("Cities listed", { state, page, limit, total });
  res.json({ data: cities, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// GET /api/cities/:id — single city with full details
const cityParamsSchema = z.object({ id: z.string().uuid() });

router.get("/:id", validate({ params: cityParamsSchema }), async (req: Request, res: Response) => {
  const city = await prisma.city.findUnique({
    where: { id: req.params.id },
    include: {
      officials: true,
      _count: { select: { issues: true, budgets: true } },
    },
  });

  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  res.json({ data: city });
});

// GET /api/cities/:id/report-card — city report card with comparison
router.get("/:id/report-card", validate({ params: cityParamsSchema }), async (req: Request, res: Response) => {
  const city = await prisma.city.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      state: true,
      grade: true,
      responseRate: true,
      avgResolveDays: true,
      lastGradedAt: true,
    },
  });

  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  // Get peer cities in the same state for comparison
  const peers = await prisma.city.findMany({
    where: { state: city.state, id: { not: city.id } },
    select: { id: true, name: true, grade: true, responseRate: true, avgResolveDays: true },
    orderBy: { grade: "asc" },
    take: 10,
  });

  res.json({ data: { ...city, peers } });
});

export default router;
