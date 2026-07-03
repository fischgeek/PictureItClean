import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Layout } from "../components/Layout";
import { ShareModal } from "../components/ShareModal";

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
  const [justVerified, setJustVerified] = useState(false);

  const { data: space, isLoading } = useQuery({ queryKey: ["space", spaceId], queryFn: () => api.getSpace(spaceId!) });
  const { data: history } = useQuery({ queryKey: ["verifications", spaceId], queryFn: () => api.listVerifications(spaceId!) });

  const invalidateSpace = () => queryClient.invalidateQueries({ queryKey: ["space", spaceId] });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => api.uploadSpacePhoto(spaceId!, file),
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
      setChecked({});
      setNote("");
      setJustVerified(true);
      queryClient.invalidateQueries({ queryKey: ["verifications", spaceId] });
      setTimeout(() => setJustVerified(false), 4000);
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{space.name}</h1>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setShowShare(true)}>
            Share
          </button>
          <button className="btn-secondary text-sm" onClick={() => setEditMode((v) => !v)}>
            {editMode ? "Done editing" : "Edit"}
          </button>
        </div>
      </div>

      <div className="card-glass overflow-hidden mb-4">
        <div className="aspect-video bg-slate-100/60 dark:bg-white/5 flex items-center justify-center">
          {space.currentPhoto ? (
            <img src={api.photoUrl(space.currentPhoto.id)} alt={space.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 dark:text-slate-500">No reference photo yet</span>
          )}
        </div>
        {(editMode || !space.currentPhoto) && (
          <div className="p-3 border-t border-white/40 dark:border-white/10">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto.mutate(file);
              }}
            />
            <button className="text-sm text-brand-600 dark:text-brand-400 hover:underline" onClick={() => fileInput.current?.click()}>
              {space.currentPhoto ? "Replace photo" : "Upload photo"}
            </button>
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
          {editMode ? (
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
              {editMode && (
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

        {editMode && (
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
        {justVerified && <p className="text-brand-600 dark:text-brand-400 text-sm mt-2">Verification recorded. Thank you!</p>}
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

      {editMode && (
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
