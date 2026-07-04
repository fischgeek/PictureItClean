import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { EditableTitle } from "../components/EditableTitle";
import { Layout } from "../components/Layout";
import { ShareModal } from "../components/ShareModal";
import { PlusIcon, TrashIcon } from "../components/icons";
import { useLightbox } from "../components/Lightbox";

export function SpacePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [showShare, setShowShare] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [newItemMinutes, setNewItemMinutes] = useState(5);

  const { data: space, isLoading } = useQuery({ queryKey: ["space", spaceId], queryFn: () => api.getSpace(spaceId!) });
  const { data: history } = useQuery({ queryKey: ["verifications", spaceId], queryFn: () => api.listVerifications(spaceId!) });
  const { data: photos } = useQuery({ queryKey: ["space-photos", spaceId], queryFn: () => api.listSpacePhotos(spaceId!) });
  const { open: openLightbox } = useLightbox();

  const canEdit = space?.myRole === "editor" || space?.myRole === "owner";

  const invalidateSpace = () => {
    queryClient.invalidateQueries({ queryKey: ["space", spaceId] });
    queryClient.invalidateQueries({ queryKey: ["space-photos", spaceId] });
  };

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => api.uploadSpacePhoto(spaceId!, file),
    onSuccess: invalidateSpace,
  });

  const deletePhoto = useMutation({
    mutationFn: (photoId: string) => api.deleteSpacePhoto(photoId),
    onSuccess: invalidateSpace,
  });

  const addItem = useMutation({
    mutationFn: () => api.createChecklistItem(spaceId!, newItemText.trim(), newItemMinutes),
    onSuccess: () => {
      setNewItemText("");
      setNewItemMinutes(5);
      invalidateSpace();
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.deleteChecklistItem(id),
    onSuccess: invalidateSpace,
  });

  const updateFrequency = useMutation({
    mutationFn: (frequencyDays: number) => api.updateSpace(spaceId!, { frequencyDays }),
    onSuccess: invalidateSpace,
  });

  const renameSpace = useMutation({
    mutationFn: (name: string) => api.updateSpace(spaceId!, { name }),
    onSuccess: invalidateSpace,
  });

  const deleteSpace = useMutation({
    mutationFn: () => api.deleteSpace(spaceId!),
    onSuccess: () => navigate(-1 as any),
  });

  const verify = useMutation({
    mutationFn: () =>
      api.submitVerification(
        spaceId!,
        Object.entries(checked)
          .filter(([, v]) => v)
          .map(([id]) => id),
        note
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifications", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/");
    },
  });

  if (isLoading || !space) {
    return (
      <Layout>
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </Layout>
    );
  }

  const totalMinutes = space.checklistItems.reduce((sum, i) => sum + i.estimatedMinutes, 0);
  const allChecked = space.checklistItems.length > 0 && space.checklistItems.every((i) => checked[i.id]);

  return (
    <Layout>
      <button className="text-sm text-brand-600 dark:text-brand-400 hover:underline" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="flex items-center justify-between mt-2 mb-4">
        <EditableTitle value={space.name} onSave={(name) => renameSpace.mutate(name)} readOnly={!canEdit} />
        {canEdit && (
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => setShowShare(true)}>
              Share
            </button>
            <button className="btn-secondary text-sm" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "Done editing" : "Edit"}
            </button>
          </div>
        )}
      </div>

      <div className="card-glass p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Photos</h2>
        </div>
        {canEdit && (
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
        )}
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={api.thumbnailUrl(photo.id)}
                  alt={space.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openLightbox(api.photoUrl(photo.id), space.name)}
                />
                {canEdit && editMode && (
                  <button
                    className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600/80 transition-colors"
                    onClick={() => {
                      if (confirm("Delete this photo?")) deletePhoto.mutate(photo.id);
                    }}
                    aria-label="Delete photo"
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <button
                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-brand-400 hover:text-brand-500 transition-colors"
                onClick={() => fileInput.current?.click()}
                aria-label="Add photo"
              >
                <PlusIcon size={24} />
              </button>
            )}
          </div>
        ) : canEdit ? (
          <button
            className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:border-brand-400 hover:text-brand-500 transition-colors"
            onClick={() => fileInput.current?.click()}
          >
            <PlusIcon size={28} />
            <span className="text-sm">Add a photo</span>
          </button>
        ) : (
          <div className="w-full aspect-video rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            No photos yet
          </div>
        )}
      </div>

      <div className="card-glass p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Checklist</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">~{totalMinutes} min total</span>
        </div>

        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500 dark:text-slate-400">
          <span>Clean every</span>
          {canEdit && editMode ? (
            <input
              type="number"
              min={1}
              className="input-glass w-16 py-1 text-sm"
              defaultValue={space.frequencyDays}
              onBlur={(e) => {
                const value = Number(e.target.value);
                if (value > 0 && value !== space.frequencyDays) updateFrequency.mutate(value);
              }}
            />
          ) : (
            <span className="font-medium text-slate-700 dark:text-slate-200">{space.frequencyDays}</span>
          )}
          <span>day{space.frequencyDays === 1 ? "" : "s"}</span>
        </div>

        <ul className="space-y-2 mb-3">
          {space.checklistItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded accent-brand-500"
                checked={!!checked[item.id]}
                onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
              />
              <span className="flex-1 text-slate-800 dark:text-slate-100">{item.text}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{item.estimatedMinutes} min</span>
              {canEdit && editMode && (
                <button
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {space.checklistItems.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No checklist items yet.</p>
          )}
        </ul>

        {canEdit && editMode && (
          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (newItemText.trim()) addItem.mutate();
            }}
          >
            <input
              className="input-glass flex-1 text-sm"
              placeholder="New checklist item"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="input-glass w-20 text-sm"
              value={newItemMinutes}
              onChange={(e) => setNewItemMinutes(Number(e.target.value))}
            />
            <button className="btn-primary text-sm">Add</button>
          </form>
        )}

        <textarea
          className="input-glass mb-2"
          placeholder="Optional note about this verification"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <button
          disabled={verify.isPending || space.checklistItems.length === 0}
          className="btn-primary w-full"
          onClick={() => verify.mutate()}
        >
          {allChecked ? "Mark Verified ✓" : "Submit Verification"}
        </button>
      </div>

      <div className="card-glass p-4 mb-4">
        <h2 className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-200">Verification history</h2>
        {history?.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm">No verifications yet.</p>}
        <ul className="space-y-2">
          {history?.map((h) => (
            <li key={h.id} className="text-sm border-b border-white/40 dark:border-white/10 pb-2 last:border-b-0">
              <span className="font-medium text-slate-800 dark:text-slate-100">{h.user?.displayName || "Someone"}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">{new Date(h.completedAt).toLocaleString()}</span>
              {h.note && <p className="text-slate-600 dark:text-slate-300 italic">“{h.note}”</p>}
            </li>
          ))}
        </ul>
      </div>

      {canEdit && editMode && (
        <button
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
          onClick={() => {
            if (confirm(`Delete "${space.name}"?`)) deleteSpace.mutate();
          }}
        >
          Delete this space
        </button>
      )}

      {showShare && spaceId && <ShareModal resourceType="space" resourceId={spaceId} onClose={() => setShowShare(false)} />}
    </Layout>
  );
}
