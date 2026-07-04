import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Layout } from "../components/Layout";

export function LocationsPage() {
  const queryClient = useQueryClient();
  const { data: buildings, isLoading } = useQuery({ queryKey: ["buildings"], queryFn: api.listBuildings });
  const [name, setName] = useState("");

  const createBuilding = useMutation({
    mutationFn: (name: string) => api.createBuilding(name),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });

  return (
    <Layout>
      <h1 className="text-2xl font-semibold tracking-tight mb-4 text-slate-800 dark:text-slate-100">Locations</h1>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createBuilding.mutate(name.trim());
        }}
      >
        <input
          className="input-glass flex-1"
          placeholder="Add a building or house (e.g. Home, Church)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary">Add</button>
      </form>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}
      {buildings?.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">No locations yet. Add one above, or accept a share invite link.</p>
      )}
      <ul className="space-y-2">
        {[...(buildings ?? [])]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((b) => (
          <li key={b.id}>
            <Link
              to={`/buildings/${b.id}`}
              className="card-glass flex items-center px-4 py-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-slate-100"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
