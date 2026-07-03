import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Layout } from "../components/Layout";
import { ShareModal } from "../components/ShareModal";

export function BuildingPage() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [showShare, setShowShare] = useState(false);

  const { data: building } = useQuery({ queryKey: ["building", buildingId], queryFn: () => api.getBuilding(buildingId!) });
  const { data: areas, isLoading } = useQuery({ queryKey: ["areas", buildingId], queryFn: () => api.listAreas(buildingId!) });

  const createArea = useMutation({
    mutationFn: (name: string) => api.createArea(buildingId!, name),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["areas", buildingId] });
    },
  });

  const deleteBuilding = useMutation({
    mutationFn: () => api.deleteBuilding(buildingId!),
    onSuccess: () => navigate("/"),
  });

  return (
    <Layout>
      <Link to="/" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
        ← All buildings
      </Link>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{building?.name || "…"}</h1>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setShowShare(true)}>
            Share
          </button>
          <button
            className="btn-danger text-sm"
            onClick={() => {
              if (confirm(`Delete "${building?.name}" and everything in it?`)) deleteBuilding.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-200">Areas</h2>
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createArea.mutate(name.trim());
        }}
      >
        <input
          className="input-glass flex-1"
          placeholder="Add an area (e.g. Kitchen, Sanctuary)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary">Add</button>
      </form>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}
      {areas?.length === 0 && <p className="text-slate-500 dark:text-slate-400">No areas yet.</p>}
      <ul className="space-y-2">
        {areas?.map((a) => (
          <li key={a.id}>
            <Link
              to={`/areas/${a.id}`}
              className="card-glass flex items-center px-4 py-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-slate-100"
            >
              {a.name}
            </Link>
          </li>
        ))}
      </ul>

      {showShare && buildingId && (
        <ShareModal resourceType="building" resourceId={buildingId} onClose={() => setShowShare(false)} />
      )}
    </Layout>
  );
}
