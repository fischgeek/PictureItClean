import React, { useState } from "react";
import { PencilIcon } from "./icons";

export function EditableTitle({
  value,
  onSave,
  readOnly = false,
}: {
  value: string;
  onSave: (newValue: string) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== value) onSave(trimmed);
  };

  if (readOnly) {
    return (
      <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 truncate">{value}</h1>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="input-glass text-2xl font-semibold tracking-tight w-full max-w-md"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to rename"
      className="flex items-center gap-2 text-left text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity min-w-0"
    >
      <span className="truncate">{value}</span>
      <span className="text-slate-400 dark:text-slate-500 shrink-0">
        <PencilIcon size={16} />
      </span>
    </button>
  );
}
