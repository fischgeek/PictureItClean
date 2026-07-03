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
    <div
      className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div className="card-glass p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Share this {resourceType}</h2>
        <label className="label-glass">Access level</label>
        <select
          className="input-glass mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
        >
          <option value="viewer">Viewer (can verify checklists)</option>
          <option value="editor">Editor (can also edit content)</option>
        </select>
        <button className="btn-primary w-full" onClick={generate}>
          Generate invite link
        </button>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>}
        {link && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Share this link:</p>
            <div className="flex gap-2">
              <input readOnly className="input-glass flex-1 text-sm" value={link} />
              <button
                className="btn-secondary text-sm"
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
        <button className="mt-4 text-sm text-slate-500 dark:text-slate-400 hover:underline" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
