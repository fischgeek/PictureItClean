import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
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

  return (
    <Layout>
      <button className="text-sm text-brand-700 hover:underline" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl font-semibold">{area?.name || "…"}</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100" onClick={() => setShowShare(true)}>
            Share
          </button>
          <button
            className="rounded border border-red-300 text-red-600 px-3 py-1 text-sm hover:bg-red-50"
            onClick={() => {
              if (confirm(`Delete "${area?.name}" and everything in it?`)) deleteArea.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-2">Spaces</h2>
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createSpace.mutate(name.trim());
        }}
      >
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Add a space (e.g. Counter, Front Pew Row)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700">Add</button>
      </form>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {spaces?.length === 0 && <p className="text-gray-500">No spaces yet.</p>}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {spaces?.map((s) => (
          <li key={s.id}>
            <Link to={`/spaces/${s.id}`} className="block bg-white rounded-lg shadow-sm border overflow-hidden hover:border-brand-500">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {s.currentPhoto ? (
                  <img src={api.thumbnailUrl(s.currentPhoto.id)} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">No photo</span>
                )}
              </div>
              <div className="px-2 py-2 text-sm font-medium truncate">{s.name}</div>
            </Link>
          </li>
        ))}
      </ul>

      {showShare && areaId && <ShareModal resourceType="area" resourceId={areaId} onClose={() => setShowShare(false)} />}
    </Layout>
  );
}
