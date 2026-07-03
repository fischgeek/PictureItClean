import { useQuery } from "@tanstack/react-query";
import React from "react";
import { api } from "../api/client";
import { DashboardStats } from "../components/DashboardStats";
import { Layout } from "../components/Layout";
import { TodayAssignmentCard } from "../components/TodayAssignmentCard";

export function DashboardPage() {
  const { data: dashboard } = useQuery({ queryKey: ["dashboard"], queryFn: api.getDashboard });

  return (
    <Layout>
      {dashboard && (
        <>
          <TodayAssignmentCard data={dashboard} />
          <DashboardStats data={dashboard} />
        </>
      )}
    </Layout>
  );
}
