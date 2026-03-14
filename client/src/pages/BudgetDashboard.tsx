// Feature 1: Budget Dashboard
// Every dollar. Every department. Plain English. Shareable.
// A person with a 6th grade education understands this in under 60 seconds.
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../lib/api";
import { formatMoney, formatMoneyFull, formatNumber } from "../lib/format";

interface Department {
  name: string;
  amount: number;
  category: string;
}

interface Budget {
  id: string;
  fiscalYear: number;
  totalRevenue: string;
  totalExpenses: string;
  departments: Department[];
  sourceUrl: string | null;
  sourceType: string | null;
}

interface City {
  id: string;
  name: string;
  state: string;
  population: number;
}

// Colors by category — deliberate, not random
const CATEGORY_COLORS: Record<string, string> = {
  public_safety: "#1a2e52",
  infrastructure: "#3d5a8a",
  utilities: "#6687c3",
  administration: "#8da5d2",
  community: "#16A34A",
  development: "#D97706",
  finance: "#9CA3AF",
  health: "#DC2626",
};

const CATEGORY_LABELS: Record<string, string> = {
  public_safety: "Public Safety",
  infrastructure: "Infrastructure",
  utilities: "Utilities",
  administration: "Administration",
  community: "Community",
  development: "Development",
  finance: "Finance",
  health: "Health",
};

export default function BudgetDashboard() {
  const [city, setCity] = useState<City | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load first city (Odessa) and its budgets
      const citiesRes: any = await api.get("/cities");
      const firstCity = citiesRes.data[0];
      if (!firstCity) return;
      setCity(firstCity);

      const budgetsRes: any = await api.get(`/cities/${firstCity.id}/budgets`);
      setBudgets(budgetsRes.data);
    } catch (err) {
      console.error("Failed to load budget data:", err);
    } finally {
      setLoading(false);
    }
  }

  const currentBudget = budgets.find((b) => b.fiscalYear === selectedYear);
  const previousBudget = budgets.find((b) => b.fiscalYear === selectedYear - 1);

  // Prepare chart data
  const departments = currentBudget?.departments || [];
  const sortedDepts = [...departments].sort((a, b) => b.amount - a.amount);

  // Category aggregation for pie chart
  const categoryTotals = departments.reduce(
    (acc: Record<string, number>, dept) => {
      const cat = dept.category || "other";
      acc[cat] = (acc[cat] || 0) + dept.amount;
      return acc;
    },
    {}
  );
  const pieData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      name: CATEGORY_LABELS[category] || category,
      value: amount,
      color: CATEGORY_COLORS[category] || "#9CA3AF",
    }))
    .sort((a, b) => b.value - a.value);

  // Year-over-year comparison data
  const yoyData = currentBudget && previousBudget
    ? sortedDepts.map((dept) => {
        const prevDept = previousBudget.departments.find(
          (d: Department) => d.name === dept.name
        );
        return {
          name: dept.name.length > 15 ? dept.name.slice(0, 15) + "…" : dept.name,
          fullName: dept.name,
          current: dept.amount / 100, // convert to dollars for chart
          previous: prevDept ? prevDept.amount / 100 : 0,
          change: prevDept
            ? ((dept.amount - prevDept.amount) / prevDept.amount) * 100
            : 0,
        };
      })
    : [];

  // Share to X
  function shareToX() {
    if (!city || !currentBudget) return;
    const text = `${city.name}, ${city.state} spent ${formatMoney(currentBudget.totalExpenses)} in FY${selectedYear}. See exactly where every dollar went on CivicOS.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

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

  if (!city || !currentBudget) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">No budget data available</h2>
        <p className="mt-2 text-gray-600">Budget data is being loaded. Check back soon.</p>
      </div>
    );
  }

  const totalExpenses = Number(currentBudget.totalExpenses);
  const totalRevenue = Number(currentBudget.totalRevenue);
  const surplus = totalRevenue - totalExpenses;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-800">
            {city.name}, {city.state}
          </h1>
          <p className="text-gray-600 mt-1">
            Population: {formatNumber(city.population || 0)} · FY{selectedYear} City Budget
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold bg-white"
            aria-label="Select fiscal year"
          >
            {budgets.map((b) => (
              <option key={b.fiscalYear} value={b.fiscalYear}>
                FY{b.fiscalYear}
              </option>
            ))}
          </select>
          {/* Share to X */}
          <button
            onClick={shareToX}
            className="bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
            aria-label="Share on X"
          >
            Share on X
          </button>
        </div>
      </div>

      {/* Top-level numbers — the 60-second summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-navy-50 rounded-lg p-6 border border-navy-100">
          <p className="text-sm font-semibold text-navy-500 uppercase tracking-wide">Total Revenue</p>
          <p className="text-3xl font-black text-navy-800 mt-1">{formatMoney(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoneyFull(totalRevenue)}</p>
        </div>
        <div className="bg-navy-50 rounded-lg p-6 border border-navy-100">
          <p className="text-sm font-semibold text-navy-500 uppercase tracking-wide">Total Spending</p>
          <p className="text-3xl font-black text-navy-800 mt-1">{formatMoney(totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoneyFull(totalExpenses)}</p>
        </div>
        <div className={`rounded-lg p-6 border ${surplus >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: surplus >= 0 ? "#16A34A" : "#DC2626" }}>
            {surplus >= 0 ? "Surplus" : "Deficit"}
          </p>
          <p className="text-3xl font-black mt-1" style={{ color: surplus >= 0 ? "#16A34A" : "#DC2626" }}>
            {formatMoney(Math.abs(surplus))}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatMoneyFull(Math.abs(surplus))}</p>
        </div>
      </div>

      {/* Per-person spending */}
      {city.population && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-600">
            That's <span className="font-bold text-navy-800">{formatMoneyFull(totalExpenses / city.population * 100)}</span> spent per resident in FY{selectedYear}.
            Every dollar of that is your money.
          </p>
        </div>
      )}

      {/* Charts — side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie chart — where's the money going by category */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-navy-800 mb-4">Where Your Money Goes</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={true}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatMoney(value * 100)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — year over year comparison */}
        {yoyData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-navy-800 mb-4">
              Year Over Year: FY{selectedYear - 1} vs FY{selectedYear}
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={yoyData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatMoney(v * 100)}
                />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => formatMoney(value * 100)}
                  labelFormatter={(label) => {
                    const item = yoyData.find((d) => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Legend />
                <Bar dataKey="previous" name={`FY${selectedYear - 1}`} fill="#b3c3e1" />
                <Bar dataKey="current" name={`FY${selectedYear}`} fill="#1a2e52" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Department breakdown table — every line item */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-navy-800">Department Breakdown</h2>
          <p className="text-sm text-gray-500">Every department. Every dollar. No hiding.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">% of Total</th>
                {previousBudget && <th className="px-6 py-3 text-right">YoY Change</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedDepts.map((dept, i) => {
                const pct = (dept.amount / totalExpenses) * 100;
                const prevDept = previousBudget?.departments.find(
                  (d: Department) => d.name === dept.name
                );
                const change = prevDept
                  ? ((dept.amount - prevDept.amount) / prevDept.amount) * 100
                  : null;

                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-sm text-gray-900">
                      {dept.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: CATEGORY_COLORS[dept.category] || "#9CA3AF" }}
                      />
                      {CATEGORY_LABELS[dept.category] || dept.category}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-mono font-semibold">
                      {formatMoney(dept.amount)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">
                      {pct.toFixed(1)}%
                    </td>
                    {previousBudget && (
                      <td className="px-6 py-3 text-sm text-right font-semibold">
                        {change !== null ? (
                          <span className={change >= 0 ? "text-civic-red" : "text-civic-green"}>
                            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source attribution */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Data source: {currentBudget.sourceType || "Public records"} · Last updated:{" "}
        {new Date().toLocaleDateString("en-US")}
      </div>
    </div>
  );
}
