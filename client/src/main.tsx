import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import BudgetDashboard from "./pages/BudgetDashboard";
import IssueMap from "./pages/IssueMap";
import ReportIssue from "./pages/ReportIssue";
import ResponseTracker from "./pages/ResponseTracker";
import ReportCard from "./pages/ReportCard";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BudgetDashboard />} />
          <Route path="/issues" element={<IssueMap />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/tracker" element={<ResponseTracker />} />
          <Route path="/report-card" element={<ReportCard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
