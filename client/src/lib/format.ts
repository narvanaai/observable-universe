// Formatting utilities — plain English, 6th grade reading level.

// Format cents to readable dollar string: 5200000000 → "$52,000,000"
export function formatMoney(cents: number | string): string {
  const dollars = Number(cents) / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1)}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(0)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

// Format cents to full dollar string with commas: 5200000000 → "$52,000,000"
export function formatMoneyFull(cents: number | string): string {
  const dollars = Number(cents) / 100;
  return "$" + dollars.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Format percentage: 0.834 → "83.4%"
export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

// Format number with commas: 127352 → "127,352"
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// Relative time: "3 days ago", "2 hours ago"
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Grade to CSS class
export function gradeClass(grade: string | null): string {
  if (!grade) return "bg-gray-200 text-gray-600";
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case "A": return "grade-a";
    case "B": return "grade-b";
    case "C": return "grade-c";
    case "D": return "grade-d";
    case "F": return "grade-f";
    default: return "bg-gray-200 text-gray-600";
  }
}

// Status to CSS class and label
export function statusDisplay(status: string): { label: string; className: string } {
  switch (status) {
    case "REPORTED": return { label: "Reported", className: "status-reported" };
    case "ACKNOWLEDGED": return { label: "Acknowledged", className: "status-acknowledged" };
    case "IN_PROGRESS": return { label: "In Progress", className: "status-in-progress" };
    case "RESOLVED": return { label: "Resolved", className: "status-resolved" };
    case "IGNORED": return { label: "IGNORED", className: "status-ignored" };
    default: return { label: status, className: "bg-gray-100 text-gray-600" };
  }
}

// Category to icon label
export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    roads: "Roads & Sidewalks",
    water: "Water & Sewage",
    lighting: "Street Lighting",
    parks: "Parks & Recreation",
    sanitation: "Sanitation & Trash",
    other: "Other",
  };
  return labels[category] || category;
}
