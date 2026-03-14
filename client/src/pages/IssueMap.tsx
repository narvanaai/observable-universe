// Feature 2: Issue Map — every issue pinned, visible, undeniable.
// Works on a 4-year-old Android phone with mediocre signal.
import { useState, useEffect } from "react";
import api from "../lib/api";
import { statusDisplay, categoryLabel, timeAgo } from "../lib/format";
import { clsx } from "clsx";

interface Issue {
  id: string;
  title: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  photoUrls: string[];
  signatureCount: number;
  reportedAt: string;
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "roads", label: "Roads & Sidewalks" },
  { value: "water", label: "Water & Sewage" },
  { value: "lighting", label: "Street Lighting" },
  { value: "parks", label: "Parks & Recreation" },
  { value: "sanitation", label: "Sanitation & Trash" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "REPORTED", label: "Reported" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "IGNORED", label: "IGNORED" },
];

export default function IssueMap() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"newest" | "most_signatures">("newest");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);

  useEffect(() => {
    loadCity();
  }, []);

  useEffect(() => {
    if (cityId) loadIssues();
  }, [cityId, category, status, sort]);

  async function loadCity() {
    try {
      const res: any = await api.get("/cities");
      if (res.data[0]) {
        setCityId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load city:", err);
      setLoading(false);
    }
  }

  async function loadIssues() {
    setLoading(true);
    try {
      const params: any = { sort, limit: 50 };
      if (category) params.category = category;
      if (status) params.status = status;

      const res: any = await api.get(`/cities/${cityId}/issues`, { params });
      setIssues(res.data);
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-navy-800">Reported Issues</h1>
        <p className="text-gray-600 mt-1">
          Every pothole, broken pipe, and dead streetlight. Mapped. Tracked. Public.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          aria-label="Sort issues"
        >
          <option value="newest">Newest First</option>
          <option value="most_signatures">Most Signatures</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Issue count */}
      <p className="text-sm text-gray-500 mb-4">
        {loading ? "Loading..." : `${issues.length} issues`}
      </p>

      {/* Map placeholder + Issue list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map area — Mapbox GL integration point */}
        <div className="lg:col-span-2 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden" style={{ minHeight: 500 }}>
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center p-8">
              <div className="text-4xl mb-4">&#x1F5FA;</div>
              <p className="font-semibold text-lg">Interactive Map</p>
              <p className="text-sm mt-2">
                Configure your Mapbox token in <code className="bg-gray-200 px-1 rounded text-xs">VITE_MAPBOX_TOKEN</code> to enable the interactive map.
              </p>
              <p className="text-sm mt-1">
                Issues are plotted at their GPS coordinates. Click to view details.
              </p>
              {/* Issue pins rendered as dots */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {issues.slice(0, 20).map((issue) => {
                  const { className } = statusDisplay(issue.status);
                  return (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={clsx(
                        "w-4 h-4 rounded-full border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-150",
                        issue.status === "IGNORED" ? "bg-civic-red" :
                        issue.status === "RESOLVED" ? "bg-civic-green" :
                        issue.status === "IN_PROGRESS" ? "bg-civic-amber" :
                        "bg-navy-500"
                      )}
                      title={issue.title}
                      aria-label={`Issue: ${issue.title}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Issue list sidebar */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {issues.map((issue) => {
            const { label, className } = statusDisplay(issue.status);
            return (
              <button
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className={clsx(
                  "w-full text-left bg-white border rounded-lg p-4 hover:border-navy-300 transition-colors",
                  selectedIssue?.id === issue.id ? "border-navy-500 ring-2 ring-navy-100" : "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {issue.title}
                  </h3>
                  <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap", className)}>
                    {label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{categoryLabel(issue.category)}</p>
                {issue.address && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{issue.address}</p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{issue.signatureCount} signatures</span>
                  <span>{timeAgo(issue.reportedAt)}</span>
                </div>
              </button>
            );
          })}

          {!loading && issues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="font-semibold">No issues found</p>
              <p className="text-sm mt-1">Try adjusting your filters or report a new issue.</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected issue detail modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    statusDisplay(selectedIssue.status).className
                  )}>
                    {statusDisplay(selectedIssue.status).label}
                  </span>
                  <h2 className="text-xl font-bold text-navy-800 mt-2">{selectedIssue.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{categoryLabel(selectedIssue.category)}</p>
              {selectedIssue.address && (
                <p className="text-sm text-gray-500 mt-1">{selectedIssue.address}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="font-bold text-navy-800">
                  {selectedIssue.signatureCount} signatures
                </span>
                <span className="text-gray-400">
                  Reported {timeAgo(selectedIssue.reportedAt)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button className="flex-1 bg-navy-800 hover:bg-navy-700 text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors">
                  Sign This Issue
                </button>
                <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm transition-colors">
                  Share on X
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
