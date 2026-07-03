import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { EditableTitle } from "../components/EditableTitle";
import { Layout } from "../components/Layout";
import { ShareModal } from "../components/ShareModal";

export function AreaPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [showShare, setShowShare] = useState(false);

  const { data: area } = useQuery({ queryKey: ["area", areaId], queryFn: () => api.getArea(areaId!) });
  const { data: spaces, isLoading } = useQuery({ queryKey: ["spaces", areaId], queryFn: () => api.listSpaces(areaId!) });

  const createSpace = useMutation({
    mutationFn: (name: string) => api.createSpace(areaId!, name),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["spaces", areaId] });
    },
  });

  const deleteArea = useMutation({
    mutationFn: () => api.deleteArea(areaId!),
    onSuccess: () => navigate(-1 as any),
  });

  const renameArea = useMutation({
    mutationFn: (newName: string) => api.updateArea(areaId!, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["area", areaId] }),
  });

  return (
    <Layout>
      <button className="text-sm text-brand-600 dark:text-brand-400 hover:underline" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="flex items-center justify-between mt-2 mb-4">
        {area ? (
          <EditableTitle value={area.name} onSave={(name) => renameArea.mutate(name)} />
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">…</h1>
        )}
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setShowShare(true)}>
            Share
          </button>
          <button
            className="btn-danger text-sm"
            onClick={() => {
              if (confirm(`Delete "${area?.name}" and everything in it?`)) deleteArea.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-200">Spaces</h2>
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createSpace.mutate(name.trim());
        }}
      >
        <input
          className="input-glass flex-1"
          placeholder="Add a space (e.g. Counter, Front Pew Row)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary">Add</button>
      </form>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}
      {spaces?.length === 0 && <p className="text-slate-500 dark:text-slate-400">No spaces yet.</p>}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {spaces?.map((s) => (
          <li key={s.id}>
            <Link
              to={`/spaces/${s.id}`}
              className="card-glass block overflow-hidden hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
            >
              <div className="aspect-square bg-slate-100/60 dark:bg-white/5 flex items-center justify-center">
                {s.currentPhoto ? (
                  <img src={api.thumbnailUrl(s.currentPhoto.id)} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 text-sm">No photo</span>
                )}
              </div>
              <div className="px-2 py-2 text-sm font-medium truncate text-slate-800 dark:text-slate-100">{s.name}</div>
            </Link>
          </li>
        ))}
      </ul>

      {showShare && areaId && <ShareModal resourceType="area" resourceId={areaId} onClose={() => setShowShare(false)} />}
    </Layout>
  );
}
