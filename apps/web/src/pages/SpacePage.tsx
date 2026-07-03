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
        <p className="text-gray-500">Loading…</p>
      </Layout>
    );
  }

  const totalMinutes = space.checklistItems.reduce((sum, i) => sum + i.estimatedMinutes, 0);
  const allChecked = space.checklistItems.length > 0 && space.checklistItems.every((i) => checked[i.id]);

  return (
    <Layout>
      <button className="text-sm text-brand-700 hover:underline" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl font-semibold">{space.name}</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100" onClick={() => setShowShare(true)}>
            Share
          </button>
          <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100" onClick={() => setEditMode((v) => !v)}>
            {editMode ? "Done editing" : "Edit"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4">
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {space.currentPhoto ? (
            <img src={api.photoUrl(space.currentPhoto.id)} alt={space.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">No reference photo yet</span>
          )}
        </div>
        {editMode && (
          <div className="p-3 border-t">
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
            <button className="text-sm text-brand-700 hover:underline" onClick={() => fileInput.current?.click()}>
              {space.currentPhoto ? "Replace photo" : "Upload photo"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Checklist</h2>
          <span className="text-sm text-gray-500">~{totalMinutes} min total</span>
        </div>

        <ul className="space-y-2 mb-3">
          {space.checklistItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-5 h-5"
                checked={!!checked[item.id]}
                onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
              />
              <span className="flex-1">{item.text}</span>
              <span className="text-sm text-gray-500">{item.estimatedMinutes} min</span>
              {editMode && (
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {space.checklistItems.length === 0 && <p className="text-gray-500 text-sm">No checklist items yet.</p>}
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
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="New checklist item"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="w-20 border rounded px-2 py-2 text-sm"
              value={newItemMinutes}
              onChange={(e) => setNewItemMinutes(Number(e.target.value))}
            />
            <button className="rounded bg-brand-600 text-white px-3 py-2 text-sm hover:bg-brand-700">Add</button>
          </form>
        )}

        <textarea
          className="w-full border rounded px-3 py-2 text-sm mb-2"
          placeholder="Optional note about this verification"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <button
          disabled={verify.isPending || space.checklistItems.length === 0}
          className="w-full rounded bg-brand-600 text-white py-2 hover:bg-brand-700 disabled:opacity-50"
          onClick={() => verify.mutate()}
        >
          {allChecked ? "Mark Verified ✓" : "Submit Verification"}
        </button>
        {justVerified && <p className="text-brand-700 text-sm mt-2">Verification recorded. Thank you!</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h2 className="text-lg font-medium mb-2">Verification history</h2>
        {history?.length === 0 && <p className="text-gray-500 text-sm">No verifications yet.</p>}
        <ul className="space-y-2">
          {history?.map((h) => (
            <li key={h.id} className="text-sm border-b pb-2 last:border-b-0">
              <span className="font-medium">{h.user?.displayName || "Someone"}</span>{" "}
              <span className="text-gray-500">{new Date(h.completedAt).toLocaleString()}</span>
              {h.note && <p className="text-gray-600 italic">“{h.note}”</p>}
            </li>
          ))}
        </ul>
      </div>

      {editMode && (
        <button
          className="text-sm text-red-600 hover:underline"
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
