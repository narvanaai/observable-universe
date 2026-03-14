// Notification routes — every alert logged, every escalation tracked.
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { validate } from "../middleware/validate";

const router = Router();

// GET /api/notifications — get user's notifications
const notifQuery = z.object({
  unreadOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/", validate({ query: notifQuery }), async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { unreadOnly, page, limit } = req.query as unknown as z.infer<typeof notifQuery>;
  const where: any = { userId };
  if (unreadOnly) where.readAt = null;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        issue: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({ data: notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// PATCH /api/notifications/:id/read — mark notification as read
const notifParams = z.object({ id: z.string().uuid() });

router.patch("/:id/read", validate({ params: notifParams }), async (req: Request, res: Response) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { readAt: new Date() },
  });

  res.json({ data: notification });
});

export default router;
