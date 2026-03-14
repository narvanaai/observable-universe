// Pressure Engine routes — turn individual frustration into organized pressure.
// Formal letters, escalation alerts, pre-written social media copy.
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { validate } from "../middleware/validate";

const router = Router();

// GET /api/issues/:issueId/pressure — get pressure data for an issue
const pressureParams = z.object({ issueId: z.string().uuid() });

router.get(
  "/issues/:issueId/pressure",
  validate({ params: pressureParams }),
  async (req: Request, res: Response) => {
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.issueId },
      include: {
        city: {
          select: { name: true, state: true },
          include: { officials: true },
        },
        _count: { select: { signatures: true } },
      },
    });

    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    // Generate pre-written content for pressure actions
    const cityName = `${issue.city.name}, ${issue.city.state}`;
    const daysSinceReport = Math.floor(
      (Date.now() - issue.reportedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Pre-written X post copy
    const tweetCopy = `${issue.title} in ${cityName} has been ${issue.status === "IGNORED" ? "IGNORED" : "unresolved"} for ${daysSinceReport} days. ${issue.signatureCount} people are demanding action. #CivicOS #FixIt${issue.city.name.replace(/\s/g, "")}`;

    // Auto-generated formal letter
    const formalLetter = generateFormalLetter(issue, cityName, daysSinceReport);

    // Next escalation threshold
    const thresholds = [50, 100, 500, 1000, 5000];
    const nextThreshold = thresholds.find((t) => t > issue.signatureCount) || null;

    res.json({
      data: {
        issueId: issue.id,
        signatureCount: issue.signatureCount,
        daysSinceReport,
        status: issue.status,
        nextThreshold,
        signaturesUntilNextThreshold: nextThreshold
          ? nextThreshold - issue.signatureCount
          : null,
        tweetCopy,
        formalLetter,
        officials: issue.city.officials,
      },
    });
  }
);

// POST /api/issues/:issueId/escalate — manually trigger escalation
router.post(
  "/issues/:issueId/escalate",
  validate({ params: pressureParams }),
  async (req: Request, res: Response) => {
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.issueId },
      include: { city: { select: { name: true, state: true } } },
    });

    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    // Create escalation notification
    await prisma.notification.create({
      data: {
        issueId: issue.id,
        type: "ESCALATION",
        channel: "EMAIL",
        subject: `Escalation: ${issue.title}`,
        body: `Issue "${issue.title}" in ${issue.city.name}, ${issue.city.state} has been escalated by a citizen. Current status: ${issue.status}. Signatures: ${issue.signatureCount}.`,
      },
    });

    // Log the escalation timeline entry
    await prisma.issueUpdate.create({
      data: {
        issueId: issue.id,
        authorType: "CITIZEN",
        authorId: (req as any).auth?.userId || null,
        comment: "Issue escalated by citizen",
      },
    });

    logger.info("Issue escalated", {
      issueId: issue.id,
      signatureCount: issue.signatureCount,
    });

    res.json({ data: { escalated: true, issueId: issue.id } });
  }
);

function generateFormalLetter(
  issue: any,
  cityName: string,
  daysSinceReport: number
): string {
  return `To Whom It May Concern,

I am writing to formally bring to your attention an unresolved civic issue in ${cityName}.

Issue: ${issue.title}
Location: ${issue.address || `${issue.latitude}, ${issue.longitude}`}
Category: ${issue.category}
Date Reported: ${issue.reportedAt.toISOString().split("T")[0]}
Days Unresolved: ${daysSinceReport}
Community Signatures: ${issue.signatureCount}

Description:
${issue.description}

This issue has been reported through CivicOS and has garnered the attention of ${issue.signatureCount} concerned citizen${issue.signatureCount !== 1 ? "s" : ""}. We respectfully request immediate attention and a public response regarding the timeline for resolution.

As public servants entrusted with taxpayer dollars, we expect accountability and transparency in addressing the infrastructure needs of our community.

Respectfully,
A Concerned Citizen of ${cityName}

---
This letter was generated via CivicOS (civicos.us) — a civic transparency platform.
Built in the USA.`;
}

export default router;
