import React from "react";
import { Link } from "react-router-dom";
import { DashboardData, api } from "../api/client";

export function TodayAssignmentCard({ data }: { data: DashboardData }) {
  if (!data.hasAssignmentPool) {
    return (
      <div className="card-glass p-4 mb-6">
        <h2 className="text-lg font-medium mb-1 text-slate-700 dark:text-slate-200">Your assignment</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No spaces are assigned to you yet. Ask an admin to assign you some buildings, areas, or spaces to keep clean.
        </p>
      </div>
    );
  }

  if (!data.myAssignment) {
    return (
      <div className="card-glass p-4 mb-6">
        <h2 className="text-lg font-medium mb-1 text-slate-700 dark:text-slate-200">Your assignment</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Nothing to show right now — check back later.</p>
      </div>
    );
  }

  const { space, area, building, checklistItems, currentPhoto, lastVerifiedAt } = data.myAssignment;
  const totalMinutes = checklistItems.reduce((sum, i) => sum + i.estimatedMinutes, 0);

  return (
    <div className="card-glass overflow-hidden mb-6">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-48 aspect-video sm:aspect-square bg-slate-100/60 dark:bg-white/5 flex items-center justify-center shrink-0">
          {currentPhoto ? (
            <img src={api.thumbnailUrl(currentPhoto.id)} alt={space.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-sm">No photo</span>
          )}
        </div>
        <div className="p-4 flex-1">
          <p className="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium mb-1">
            Today&apos;s assignment
          </p>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{space.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {building?.name}
            {area ? ` › ${area.name}` : ""}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {checklistItems.length} checklist item{checklistItems.length === 1 ? "" : "s"} · ~{totalMinutes} min · every{" "}
            {space.frequencyDays} day{space.frequencyDays === 1 ? "" : "s"}
            {lastVerifiedAt && <> · last done {new Date(lastVerifiedAt).toLocaleDateString()}</>}
            {!lastVerifiedAt && <> · never verified</>}
          </p>
          <Link to={`/spaces/${space.id}`} className="btn-primary">
            Go verify
          </Link>
        </div>
      </div>
    </div>
  );
}
