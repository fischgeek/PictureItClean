import React from "react";
import { DashboardData } from "../api/client";
import { formatMinutes } from "../utils/formatMinutes";

export function AssignmentSummaryCard({ data }: { data: DashboardData }) {
  if (!data.hasAssignmentPool) {
    return (
      <div className="card-glass p-4 mb-4">
        <h2 className="text-lg font-medium mb-1 text-slate-700 dark:text-slate-200">Your assignments</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No spaces are assigned to you yet. Ask an admin to assign you some buildings, areas, or spaces to keep clean.
        </p>
      </div>
    );
  }

  if (data.pendingCount === 0) {
    return (
      <div className="card-glass p-4 mb-4">
        <h2 className="text-lg font-medium mb-1 text-slate-700 dark:text-slate-200">Your assignments</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">All caught up! Nothing pending right now.</p>
      </div>
    );
  }

  return (
    <div className="card-glass p-4 mb-4">
      <h2 className="text-lg font-medium mb-1 text-slate-700 dark:text-slate-200">Your assignments</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {data.pendingCount} assignment{data.pendingCount === 1 ? "" : "s"} pending · about{" "}
        {formatMinutes(data.pendingTotalMinutes)} total
      </p>
    </div>
  );
}
