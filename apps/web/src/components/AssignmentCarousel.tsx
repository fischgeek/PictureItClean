import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, MyAssignment } from "../api/client";
import { formatMinutes } from "../utils/formatMinutes";
import { ChevronLeftIcon, ChevronRightIcon, SkipIcon } from "./icons";

function AssignmentCard({ assignment, onSkip, skipping }: { assignment: MyAssignment; onSkip: () => void; skipping: boolean }) {
  const { space, area, building, checklistItems, currentPhoto, lastVerifiedAt } = assignment;
  const totalMinutes = checklistItems.reduce((sum, i) => sum + i.estimatedMinutes, 0);

  return (
    <div className="card-glass overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-48 aspect-video sm:aspect-square bg-slate-100/60 dark:bg-white/5 flex items-center justify-center shrink-0">
          {currentPhoto ? (
            <img
              src={api.thumbnailUrl(currentPhoto.id)}
              alt={space.name}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-sm">No photo</span>
          )}
        </div>
        <div className="p-4 flex-1">
          <p className="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium mb-1">Assignment</p>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{space.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {building?.name}
            {area ? ` › ${area.name}` : ""}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {checklistItems.length} checklist item{checklistItems.length === 1 ? "" : "s"} · ~{formatMinutes(totalMinutes)} ·
            every {space.frequencyDays} day{space.frequencyDays === 1 ? "" : "s"}
            {lastVerifiedAt && <> · last done {new Date(lastVerifiedAt).toLocaleDateString()}</>}
            {!lastVerifiedAt && <> · never verified</>}
          </p>
          <div className="flex gap-2">
            <Link to={`/spaces/${space.id}`} className="btn-primary">
              Go verify
            </Link>
            <button className="btn-secondary" disabled={skipping} onClick={onSkip}>
              <SkipIcon size={16} />
              Skip for a day
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssignmentCarousel({ assignments }: { assignments: MyAssignment[] }) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const drag = useRef<{ startX: number } | null>(null);
  const trackWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (index > assignments.length - 1) setIndex(Math.max(0, assignments.length - 1));
  }, [assignments.length, index]);

  const skip = useMutation({
    mutationFn: (id: string) => api.skipAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  if (assignments.length === 0) return null;

  const go = (dir: number) => setIndex((i) => Math.min(Math.max(i + dir, 0), assignments.length - 1));

  const onPointerDown = (e: React.PointerEvent) => {
    if (assignments.length <= 1) return;
    trackWidth.current = containerRef.current?.clientWidth ?? 1;
    drag.current = { startX: e.clientX };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setDragOffset(e.clientX - drag.current.startX);
  };
  const endDrag = () => {
    if (!drag.current) return;
    const threshold = trackWidth.current * 0.2;
    if (dragOffset < -threshold) go(1);
    else if (dragOffset > threshold) go(-1);
    setDragOffset(0);
    drag.current = null;
  };

  return (
    <div className="mb-4">
      <div
        ref={containerRef}
        className="overflow-hidden touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={`flex ${drag.current ? "" : "transition-transform duration-200 ease-out"}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${drag.current ? dragOffset : 0}px))` }}
        >
          {assignments.map((a) => (
            <div key={a.id} className="w-full shrink-0">
              <AssignmentCard assignment={a} onSkip={() => skip.mutate(a.id)} skipping={skip.isPending} />
            </div>
          ))}
        </div>
      </div>

      {assignments.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <button className="icon-btn disabled:opacity-30" disabled={index === 0} onClick={() => go(-1)} aria-label="Previous">
            <ChevronLeftIcon size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            {assignments.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to assignment ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-brand-500" : "w-1.5 bg-slate-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>
          <button
            className="icon-btn disabled:opacity-30"
            disabled={index === assignments.length - 1}
            onClick={() => go(1)}
            aria-label="Next"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
