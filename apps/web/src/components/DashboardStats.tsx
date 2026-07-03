import React from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardData } from "../api/client";

const GRID_STROKE = "rgba(148, 163, 184, 0.25)";
const AXIS_STROKE = "#94a3b8";
const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="card-glass p-4">
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">{title}</h3>
      {empty ? <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">Not enough data yet.</p> : children}
    </div>
  );
}

export function DashboardStats({ data }: { data: DashboardData }) {
  const trendHasData = data.verificationTrend.some((d) => d.count > 0);
  const complianceHasData = data.complianceByBuilding.length > 0;
  const activityHasData = data.activityByUser.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <ChartCard title="Verifications over the last 14 days" empty={!trendHasData}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.verificationTrend}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={AXIS_STROKE}
              tick={AXIS_TICK}
              tickFormatter={(d: string) => d.slice(5)}
              minTickGap={20}
            />
            <YAxis stroke={AXIS_STROKE} tick={AXIS_TICK} allowDecimals={false} width={28} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }} />
            <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Compliance by building" empty={!complianceHasData}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.complianceByBuilding} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke={AXIS_STROKE} tick={AXIS_TICK} unit="%" />
            <YAxis type="category" dataKey="name" stroke={AXIS_STROKE} tick={AXIS_TICK} width={80} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }}
              formatter={(v) => [`${v}%`, "Compliant"]}
            />
            <Bar dataKey="percent" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Needs attention" empty={data.overdueSpaces.length === 0}>
        <ul className="space-y-2 max-h-[200px] overflow-y-auto">
          {data.overdueSpaces.map((s) => (
            <li key={s.spaceId}>
              <Link
                to={`/spaces/${s.spaceId}`}
                className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {s.spaceName}
                  <span className="text-slate-400 dark:text-slate-500"> · {s.buildingName} / {s.areaName}</span>
                </span>
                <span className="text-red-500 dark:text-red-400 font-medium shrink-0 ml-2">
                  {s.daysOverdue === null ? "never done" : `${s.daysOverdue}d overdue`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ChartCard>

      <ChartCard title="Activity by user" empty={!activityHasData}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.activityByUser} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke={AXIS_STROKE} tick={AXIS_TICK} />
            <YAxis type="category" dataKey="displayName" stroke={AXIS_STROKE} tick={AXIS_TICK} width={90} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }} />
            <Bar dataKey="count" fill="#2dd4bf" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
