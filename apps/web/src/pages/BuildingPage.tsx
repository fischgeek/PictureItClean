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
      <Link to="/" className="text-sm text-brand-700 hover:underline">
        ← All buildings
      </Link>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl font-semibold">{building?.name || "…"}</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100" onClick={() => setShowShare(true)}>
            Share
          </button>
          <button
            className="rounded border border-red-300 text-red-600 px-3 py-1 text-sm hover:bg-red-50"
            onClick={() => {
              if (confirm(`Delete "${building?.name}" and everything in it?`)) deleteBuilding.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-2">Areas</h2>
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createArea.mutate(name.trim());
        }}
      >
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Add an area (e.g. Kitchen, Sanctuary)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700">Add</button>
      </form>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {areas?.length === 0 && <p className="text-gray-500">No areas yet.</p>}
      <ul className="space-y-2">
        {areas?.map((a) => (
          <li key={a.id}>
            <Link to={`/areas/${a.id}`} className="block bg-white rounded-lg shadow-sm border px-4 py-3 hover:border-brand-500">
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
