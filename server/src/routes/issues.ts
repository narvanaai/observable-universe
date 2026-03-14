// Issue routes — the civic complaint pipeline.
// Report it. Map it. Pile on. Force a response.
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { validate } from "../middleware/validate";

const router = Router();

// GET /api/cities/:cityId/issues — paginated issues for a city
const cityIssuesParams = z.object({ cityId: z.string().uuid() });
const issuesQuery = z.object({
  status: z.enum(["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "IGNORED"]).optional(),
  category: z.string().optional(),
  sort: z.enum(["newest", "oldest", "most_signatures"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get(
  "/cities/:cityId/issues",
  validate({ params: cityIssuesParams, query: issuesQuery }),
  async (req: Request, res: Response) => {
    const { cityId } = req.params;
    const { status, category, sort, page, limit } = req.query as unknown as z.infer<typeof issuesQuery>;

    const where: any = { cityId };
    if (status) where.status = status;
    if (category) where.category = category;

    const orderBy =
      sort === "most_signatures"
        ? { signatureCount: "desc" as const }
        : sort === "oldest"
          ? { reportedAt: "asc" as const }
          : { reportedAt: "desc" as const };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          latitude: true,
          longitude: true,
          address: true,
          photoUrls: true,
          signatureCount: true,
          reportedAt: true,
          acknowledgedAt: true,
          resolvedAt: true,
        },
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({ data: issues, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }
);

// GET /api/issues/:id — full issue detail with timeline
const issueParams = z.object({ id: z.string().uuid() });

router.get("/:id", validate({ params: issueParams }), async (req: Request, res: Response) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.id },
    include: {
      city: { select: { id: true, name: true, state: true } },
      updates: { orderBy: { createdAt: "asc" } },
      _count: { select: { signatures: true } },
    },
  });

  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  res.json({ data: issue });
});

// POST /api/issues — report a new issue
const createIssueSchema = z.object({
  cityId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(["roads", "water", "lighting", "parks", "sanitation", "other"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
  anonymous: z.boolean().default(false),
});

router.post("/", validate({ body: createIssueSchema }), async (req: Request, res: Response) => {
  const data = req.body as z.infer<typeof createIssueSchema>;
  const userId = data.anonymous ? null : (req as any).auth?.userId || null;

  // Verify city exists
  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  const issue = await prisma.issue.create({
    data: {
      cityId: data.cityId,
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      photoUrls: data.photoUrls || [],
    },
  });

  // Create the initial timeline entry
  await prisma.issueUpdate.create({
    data: {
      issueId: issue.id,
      authorType: "CITIZEN",
      authorId: userId,
      newStatus: "REPORTED",
      comment: "Issue reported",
    },
  });

  logger.info("Issue reported", {
    issueId: issue.id,
    cityId: data.cityId,
    category: data.category,
    anonymous: data.anonymous,
  });

  res.status(201).json({ data: issue });
});

// POST /api/issues/:id/signatures — sign an issue (add pressure)
const signatureBody = z.object({
  comment: z.string().max(500).optional(),
  anonymous: z.boolean().default(false),
});

router.post(
  "/:id/signatures",
  validate({ params: issueParams, body: signatureBody }),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { comment, anonymous } = req.body as z.infer<typeof signatureBody>;
    const userId = anonymous ? null : (req as any).auth?.userId || null;

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    // Create signature and increment count in a transaction
    const [signature] = await prisma.$transaction([
      prisma.issueSignature.create({
        data: { issueId: id, userId, comment },
      }),
      prisma.issue.update({
        where: { id },
        data: { signatureCount: { increment: 1 } },
      }),
    ]);

    const newCount = issue.signatureCount + 1;

    // Check escalation thresholds: 50, 100, 500
    const thresholds = [50, 100, 500];
    if (thresholds.includes(newCount)) {
      logger.info("Escalation threshold reached", {
        issueId: id,
        threshold: newCount,
        title: issue.title,
      });
      // Notification creation happens here — handled by notification service
      await prisma.notification.create({
        data: {
          issueId: id,
          type: "SIGNATURE_MILESTONE",
          channel: "IN_APP",
          body: `Issue "${issue.title}" has reached ${newCount} signatures`,
        },
      });
    }

    logger.info("Issue signed", { issueId: id, newCount });
    res.status(201).json({ data: signature, signatureCount: newCount });
  }
);

// PATCH /api/issues/:id/status — update issue status (officials only)
const statusUpdateBody = z.object({
  status: z.enum(["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"]),
  comment: z.string().max(2000).optional(),
});

router.patch(
  "/:id/status",
  validate({ params: issueParams, body: statusUpdateBody }),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, comment } = req.body as z.infer<typeof statusUpdateBody>;
    const authorId = (req as any).auth?.userId || null;

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    const now = new Date();
    const updateData: any = { status };
    if (status === "ACKNOWLEDGED") updateData.acknowledgedAt = now;
    if (status === "RESOLVED") updateData.resolvedAt = now;

    const [updatedIssue] = await prisma.$transaction([
      prisma.issue.update({ where: { id }, data: updateData }),
      prisma.issueUpdate.create({
        data: {
          issueId: id,
          authorId,
          authorType: "OFFICIAL",
          oldStatus: issue.status,
          newStatus: status,
          comment,
        },
      }),
      prisma.notification.create({
        data: {
          issueId: id,
          userId: issue.userId,
          type: "STATUS_CHANGE",
          channel: "EMAIL",
          subject: `Issue update: ${issue.title}`,
          body: `Status changed from ${issue.status} to ${status}${comment ? `: ${comment}` : ""}`,
        },
      }),
    ]);

    logger.info("Issue status updated", {
      issueId: id,
      oldStatus: issue.status,
      newStatus: status,
      updatedBy: authorId,
    });

    res.json({ data: updatedIssue });
  }
);

export default router;
