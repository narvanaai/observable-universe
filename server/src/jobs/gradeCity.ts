// Cron job: Calculate and update city report card grades.
// Weekly. Transparent. Comparable. A mayor seeing a D will feel it.
import prisma from "../lib/prisma";
import logger from "../lib/logger";

// Grade thresholds based on response rate and resolution speed
function calculateGrade(responseRate: number, avgResolveDays: number): string {
  // Score: 60% response rate, 40% speed
  // Response rate: what % of issues got at least acknowledged
  // Avg resolve days: how fast do issues get resolved
  const speedScore = Math.max(0, 100 - avgResolveDays * 2); // penalize 2 points per day
  const combinedScore = responseRate * 60 + (speedScore / 100) * 40;

  if (combinedScore >= 93) return "A";
  if (combinedScore >= 85) return "B+";
  if (combinedScore >= 77) return "B";
  if (combinedScore >= 70) return "C+";
  if (combinedScore >= 63) return "C";
  if (combinedScore >= 55) return "D+";
  if (combinedScore >= 47) return "D";
  return "F";
}

export async function gradeCities() {
  const cities = await prisma.city.findMany({
    select: { id: true, name: true, state: true },
  });

  for (const city of cities) {
    // Get all issues for this city in the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const issues = await prisma.issue.findMany({
      where: { cityId: city.id, reportedAt: { gte: ninetyDaysAgo } },
      select: { status: true, reportedAt: true, acknowledgedAt: true, resolvedAt: true },
    });

    if (issues.length === 0) {
      // No issues = no grade. Can't grade what doesn't exist.
      continue;
    }

    // Response rate: issues that moved past REPORTED or IGNORED
    const responded = issues.filter(
      (i) => !["REPORTED", "IGNORED"].includes(i.status)
    );
    const responseRate = responded.length / issues.length;

    // Average resolution time for resolved issues
    const resolved = issues.filter((i) => i.resolvedAt);
    const avgResolveDays =
      resolved.length > 0
        ? resolved.reduce((sum, i) => {
            const days =
              (i.resolvedAt!.getTime() - i.reportedAt.getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / resolved.length
        : 30; // default penalty if nothing resolved

    const grade = calculateGrade(responseRate, avgResolveDays);

    await prisma.city.update({
      where: { id: city.id },
      data: {
        grade,
        responseRate,
        avgResolveDays,
        lastGradedAt: new Date(),
      },
    });

    logger.info("City graded", {
      city: `${city.name}, ${city.state}`,
      grade,
      responseRate: (responseRate * 100).toFixed(1) + "%",
      avgResolveDays: avgResolveDays.toFixed(1),
      issueCount: issues.length,
    });
  }

  logger.info("All cities graded", { count: cities.length });
}

if (require.main === module) {
  gradeCities()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error("Failed to grade cities", { error: err });
      process.exit(1);
    });
}
