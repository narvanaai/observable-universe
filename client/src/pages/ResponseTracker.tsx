// Feature 3: Response Tracker
// Public status. 14-day IGNORED label. Department leaderboard.
// Best and worst. Named. No hiding.
import { useState, useEffect } from "react";
import api from "../lib/api";
import { statusDisplay, formatPercent, timeAgo } from "../lib/format";
import { clsx } from "clsx";

interface Issue {
  id: string;
  title: string;
  category: string;
  status: string;
  signatureCount: number;
  reportedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

interface DepartmentStats {
  name: string;
  totalIssues: number;
  resolved: number;
  ignored: number;
  responseRate: number;
  avgDaysToRespond: number;
}

export default function ResponseTracker() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const citiesRes: any = await api.get("/cities");
      const city = citiesRes.data[0];
      if (!city) return;
      setCityName(`${city.name}, ${city.state}`);

      const issuesRes: any = await api.get(`/cities/${city.id}/issues`, {
        params: { limit: 50 },
      });
      setIssues(issuesRes.data);
    } catch (err) {
      console.error("Failed to load tracker data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const totalIssues = issues.length;
  const ignoredIssues = issues.filter((i) => i.status === "IGNORED");
  const resolvedIssues = issues.filter((i) => i.status === "RESOLVED");
  const pendingIssues = issues.filter((i) => ["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(i.status));

  const responseRate = totalIssues > 0
    ? (totalIssues - ignoredIssues.length) / totalIssues
    : 0;

  // Department leaderboard (based on category)
  const categoryStats: Record<string, DepartmentStats> = {};
  for (const issue of issues) {
    const cat = issue.category;
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        name: cat,
        totalIssues: 0,
        resolved: 0,
        ignored: 0,
        responseRate: 0,
        avgDaysToRespond: 0,
      };
    }
    categoryStats[cat].totalIssues++;
    if (issue.status === "RESOLVED") categoryStats[cat].resolved++;
    if (issue.status === "IGNORED") categoryStats[cat].ignored++;
  }

  // Calculate response rates and sort
  const leaderboard = Object.values(categoryStats)
    .map((stat) => ({
      ...stat,
      responseRate: stat.totalIssues > 0
        ? (stat.totalIssues - stat.ignored) / stat.totalIssues
        : 0,
    }))
    .sort((a, b) => b.responseRate - a.responseRate);

  const categoryLabels: Record<string, string> = {
    roads: "Roads & Sidewalks",
    water: "Water & Sewage",
    lighting: "Street Lighting",
    parks: "Parks & Recreation",
    sanitation: "Sanitation & Trash",
    other: "Other",
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-800">Response Tracker</h1>
        <p className="text-gray-600 mt-1">
          {cityName} — How fast is your city responding? Or are they ignoring you?
        </p>
      </div>

      {/* Top-level response stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Issues</p>
          <p className="text-2xl font-black text-navy-800 mt-1">{totalIssues}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Response Rate</p>
          <p className={clsx(
            "text-2xl font-black mt-1",
            responseRate >= 0.7 ? "text-civic-green" : responseRate >= 0.4 ? "text-civic-amber" : "text-civic-red"
          )}>
            {formatPercent(responseRate)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <p className="text-xs font-semibold text-civic-green uppercase">Resolved</p>
          <p className="text-2xl font-black text-civic-green mt-1">{resolvedIssues.length}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <p className="text-xs font-semibold text-civic-red uppercase">IGNORED</p>
          <p className="text-2xl font-black text-civic-red mt-1">{ignoredIssues.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-navy-800">Department Leaderboard</h2>
            <p className="text-sm text-gray-500">Best and worst. Named. No hiding.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {leaderboard.map((dept, i) => (
              <div key={dept.name} className="px-6 py-4 flex items-center gap-4">
                <span className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  i === 0 ? "bg-civic-green text-white" :
                  i === leaderboard.length - 1 ? "bg-civic-red text-white" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">
                    {categoryLabels[dept.name] || dept.name}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{dept.totalIssues} issues</span>
                    <span>{dept.resolved} resolved</span>
                    <span className={dept.ignored > 0 ? "text-civic-red font-bold" : ""}>
                      {dept.ignored} ignored
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={clsx(
                    "text-lg font-bold",
                    dept.responseRate >= 0.7 ? "text-civic-green" :
                    dept.responseRate >= 0.4 ? "text-civic-amber" :
                    "text-civic-red"
                  )}>
                    {formatPercent(dept.responseRate)}
                  </p>
                  <p className="text-xs text-gray-400">response rate</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* IGNORED Issues — the wall of shame */}
        <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-bold text-civic-red">IGNORED Issues</h2>
            <p className="text-sm text-red-600/80">
              14+ days. No response. These are being ignored.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {ignoredIssues.length > 0 ? (
              ignoredIssues.map((issue) => {
                const daysSince = Math.floor(
                  (Date.now() - new Date(issue.reportedAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={issue.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm text-gray-900">{issue.title}</h3>
                      <span className="text-civic-red font-bold text-xs whitespace-nowrap ml-2">
                        {daysSince} days
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{issue.signatureCount} signatures</span>
                      <span>Reported {timeAgo(issue.reportedAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                No ignored issues. That's how it should be.
              </div>
            )}
          </div>
        </div>

        {/* Active Issues timeline */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-navy-800">All Issues — Public Timeline</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {issues.map((issue) => {
              const { label, className } = statusDisplay(issue.status);
              const daysSince = Math.floor(
                (Date.now() - new Date(issue.reportedAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={issue.id} className="px-6 py-4 flex items-center gap-4">
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap",
                    className
                  )}>
                    {label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{issue.title}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                    <p>{daysSince}d open</p>
                    <p>{issue.signatureCount} sig.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
