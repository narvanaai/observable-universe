// Cron job: Mark issues as IGNORED after 14 days with no response.
// Not "pending." IGNORED. The word is deliberate.
// Run this daily via cron or Railway scheduled task.
import prisma from "../lib/prisma";
import logger from "../lib/logger";

export async function markIgnoredIssues() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Find all REPORTED issues older than 14 days
  const ignoredIssues = await prisma.issue.findMany({
    where: {
      status: "REPORTED",
      reportedAt: { lt: fourteenDaysAgo },
    },
    select: { id: true, title: true, cityId: true, userId: true },
  });

  if (ignoredIssues.length === 0) {
    logger.info("No issues to mark as IGNORED");
    return;
  }

  // Batch update — one transaction for all of them
  await prisma.$transaction([
    // Update all matching issues to IGNORED
    prisma.issue.updateMany({
      where: {
        status: "REPORTED",
        reportedAt: { lt: fourteenDaysAgo },
      },
      data: { status: "IGNORED" },
    }),
    // Create timeline entries for each
    ...ignoredIssues.map((issue) =>
      prisma.issueUpdate.create({
        data: {
          issueId: issue.id,
          authorType: "SYSTEM",
          oldStatus: "REPORTED",
          newStatus: "IGNORED",
          comment:
            "This issue has been IGNORED — no response from city officials for 14 days.",
        },
      })
    ),
    // Notify reporters
    ...ignoredIssues
      .filter((issue) => issue.userId)
      .map((issue) =>
        prisma.notification.create({
          data: {
            userId: issue.userId,
            issueId: issue.id,
            type: "STATUS_CHANGE",
            channel: "EMAIL",
            subject: `Your reported issue has been IGNORED`,
            body: `The issue "${issue.title}" has received no response from city officials for 14 days. It has been marked as IGNORED.`,
          },
        })
      ),
  ]);

  logger.info("Issues marked as IGNORED", { count: ignoredIssues.length });
}

// Allow running directly: tsx server/src/jobs/markIgnored.ts
if (require.main === module) {
  markIgnoredIssues()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error("Failed to mark ignored issues", { error: err });
      process.exit(1);
    });
}
