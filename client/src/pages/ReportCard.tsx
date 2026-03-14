// Feature 5: City Report Card
// Letter grade. Weekly updated. Compare cities side by side.
// A mayor seeing a D next to a neighboring city's B will feel that.
import { useState, useEffect } from "react";
import api from "../lib/api";
import { formatPercent, gradeClass } from "../lib/format";
import { clsx } from "clsx";

interface CityCard {
  id: string;
  name: string;
  state: string;
  grade: string | null;
  responseRate: number | null;
  avgResolveDays: number | null;
  lastGradedAt: string | null;
  peers?: CityCard[];
}

export default function ReportCard() {
  const [city, setCity] = useState<CityCard | null>(null);
  const [allCities, setAllCities] = useState<CityCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const citiesRes: any = await api.get("/cities");
      setAllCities(citiesRes.data);

      if (citiesRes.data[0]) {
        const reportCard: any = await api.get(`/cities/${citiesRes.data[0].id}/report-card`);
        setCity(reportCard.data);
      }
    } catch (err) {
      console.error("Failed to load report card:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-32 w-32 bg-gray-200 rounded-2xl mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">No report card data available</h2>
        <p className="text-gray-600 mt-2">Cities need reported issues before they can be graded.</p>
      </div>
    );
  }

  const grade = city.grade || "—";
  const gradeColorClass = gradeClass(city.grade);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-800">City Report Card</h1>
        <p className="text-gray-600 mt-1">
          How does your city perform? Graded weekly. Compared publicly.
        </p>
      </div>

      {/* Main city grade — big and bold */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 text-center mb-8">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {city.name}, {city.state}
        </p>
        <div className={clsx(
          "inline-flex items-center justify-center w-32 h-32 rounded-2xl text-6xl font-black",
          gradeColorClass
        )}>
          {grade}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 max-w-lg mx-auto">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Response Rate</p>
            <p className="text-2xl font-bold text-navy-800 mt-1">
              {city.responseRate !== null ? formatPercent(city.responseRate) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Avg. Days to Resolve</p>
            <p className="text-2xl font-bold text-navy-800 mt-1">
              {city.avgResolveDays !== null ? city.avgResolveDays.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Last Updated</p>
            <p className="text-2xl font-bold text-navy-800 mt-1">
              {city.lastGradedAt
                ? new Date(city.lastGradedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* How the grade is calculated */}
      <div className="bg-navy-50 border border-navy-100 rounded-lg p-6 mb-8">
        <h2 className="font-bold text-navy-800 mb-2">How is this grade calculated?</h2>
        <ul className="text-sm text-navy-600 space-y-1">
          <li><strong>60% Response Rate</strong> — What percentage of reported issues get acknowledged or addressed</li>
          <li><strong>40% Resolution Speed</strong> — How quickly issues are resolved once reported</li>
          <li>Based on the last <strong>90 days</strong> of data. Updated <strong>weekly</strong>.</li>
          <li>A city with no reported issues has no grade — we don't make up data.</li>
        </ul>
      </div>

      {/* Peer comparison */}
      {city.peers && city.peers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-navy-800">Compare: {city.state} Cities</h2>
            <p className="text-sm text-gray-500">Side by side. No hiding.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3 text-center">Grade</th>
                  <th className="px-6 py-3 text-right">Response Rate</th>
                  <th className="px-6 py-3 text-right">Avg. Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Current city first, highlighted */}
                <tr className="bg-navy-50">
                  <td className="px-6 py-3 font-bold text-sm text-navy-800">
                    {city.name}, {city.state}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "inline-block px-3 py-1 rounded-lg text-sm font-bold",
                      gradeColorClass
                    )}>
                      {grade}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold">
                    {city.responseRate !== null ? formatPercent(city.responseRate) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold">
                    {city.avgResolveDays?.toFixed(1) || "—"}
                  </td>
                </tr>
                {/* Peer cities */}
                {city.peers.map((peer) => (
                  <tr key={peer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-sm text-gray-900">
                      {peer.name}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={clsx(
                        "inline-block px-3 py-1 rounded-lg text-sm font-bold",
                        gradeClass(peer.grade)
                      )}>
                        {peer.grade || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-sm">
                      {peer.responseRate !== null ? formatPercent(peer.responseRate) : "—"}
                    </td>
                    <td className="px-6 py-3 text-right text-sm">
                      {peer.avgResolveDays?.toFixed(1) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All cities comparison */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-navy-800">All Cities on CivicOS</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {allCities.map((c) => (
            <div key={c.id} className="px-6 py-4 flex items-center gap-4">
              <span className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                gradeClass(c.grade)
              )}>
                {c.grade || "—"}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">
                  {c.name}, {c.state}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                {c.responseRate !== null ? formatPercent(c.responseRate) : "Not graded"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
