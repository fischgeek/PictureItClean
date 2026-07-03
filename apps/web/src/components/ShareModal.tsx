import React, { useState } from "react";
import { api } from "../api/client";

export function ShareModal({
  resourceType,
  resourceId,
  onClose,
}: {
  resourceType: "building" | "area" | "space";
  resourceId: string;
  onClose: () => void;
}) {
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError(null);
    try {
      const invite = await api.createShare(resourceType, resourceId, role);
      setLink(`${window.location.origin}/invite/${invite.token}`);
      setCopied(false);
    } catch (e: any) {
      setError(e.message || "Failed to create invite");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Share this {resourceType}</h2>
        <label className="block text-sm font-medium mb-1">Access level</label>
        <select
          className="w-full border rounded px-3 py-2 mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
        >
          <option value="viewer">Viewer (can verify checklists)</option>
          <option value="editor">Editor (can also edit content)</option>
        </select>
        <button className="w-full rounded bg-brand-600 text-white py-2 hover:bg-brand-700" onClick={generate}>
          Generate invite link
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {link && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-1">Share this link:</p>
            <div className="flex gap-2">
              <input readOnly className="flex-1 border rounded px-2 py-1 text-sm" value={link} />
              <button
                className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
        <button className="mt-4 text-sm text-gray-500 hover:underline" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
