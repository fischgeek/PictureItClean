import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { EditableTitle } from "../components/EditableTitle";
import { Layout } from "../components/Layout";
import { ShareModal } from "../components/ShareModal";
import { PlusIcon, TrashIcon } from "../components/icons";
import { useLightbox } from "../components/Lightbox";

export function BuildingPage() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const { open: openLightbox } = useLightbox();
  const [name, setName] = useState("");
  const [showShare, setShowShare] = useState(false);

  const { data: building } = useQuery({ queryKey: ["building", buildingId], queryFn: () => api.getBuilding(buildingId!) });
  const { data: areas, isLoading } = useQuery({ queryKey: ["areas", buildingId], queryFn: () => api.listAreas(buildingId!) });

  const invalidateBuilding = () => queryClient.invalidateQueries({ queryKey: ["building", buildingId] });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => api.uploadBuildingPhoto(buildingId!, file),
    onSuccess: invalidateBuilding,
  });

  const removePhoto = useMutation({
    mutationFn: () => api.deleteBuildingPhoto(buildingId!),
    onSuccess: invalidateBuilding,
  });

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

  const renameBuilding = useMutation({
    mutationFn: (newName: string) => api.updateBuilding(buildingId!, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["building", buildingId] }),
  });

  return (
    <Layout>
      <Link to="/locations" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
        ← All locations
      </Link>
      <div className="flex items-center justify-between mt-2 mb-4">
        {building ? (
          <EditableTitle value={building.name} onSave={(name) => renameBuilding.mutate(name)} />
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
              if (confirm(`Delete "${building?.name}" and everything in it?`)) deleteBuilding.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="card-glass overflow-hidden mb-4">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto.mutate(file);
            e.target.value = "";
          }}
        />
        {building?.photoPath ? (
          <div className="relative">
            <img
              src={api.buildingPhotoUrl(building.id)}
              alt={building.name}
              className="w-full aspect-video object-cover cursor-pointer"
              onClick={() => openLightbox(api.buildingPhotoUrl(building.id), building.name)}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                onClick={() => fileInput.current?.click()}
                aria-label="Replace photo"
              >
                <PlusIcon size={16} />
              </button>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600/80 transition-colors"
                onClick={() => {
                  if (confirm("Remove this photo?")) removePhoto.mutate();
                }}
                aria-label="Remove photo"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full aspect-video border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:border-brand-400 hover:text-brand-500 transition-colors"
            onClick={() => fileInput.current?.click()}
          >
            <PlusIcon size={28} />
            <span className="text-sm">Add a photo</span>
          </button>
        )}
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
        {[...(areas ?? [])]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => (
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
