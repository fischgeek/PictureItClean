import { useQuery } from "@tanstack/react-query";
import React from "react";
import { api } from "../api/client";
import { DashboardStats } from "../components/DashboardStats";
import { Layout } from "../components/Layout";
import { TodayAssignmentCard } from "../components/TodayAssignmentCard";

export function DashboardPage() {
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ["dashboard"], queryFn: api.getDashboard });

  return (
    <Layout>
      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}

      {isError && (
        <div className="card-glass p-4 mb-6">
          <p className="text-red-600 dark:text-red-400 font-medium mb-1">Couldn't load the dashboard.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
          <button className="btn-secondary text-sm" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}

      {dashboard && (
        <>
          <TodayAssignmentCard data={dashboard} />
          <DashboardStats data={dashboard} />
        </>
      )}
    </Layout>
  );
}
