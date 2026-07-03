import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Layout } from "../components/Layout";

export function DashboardPage() {
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
      <h1 className="text-2xl font-semibold mb-4">Your Buildings & Houses</h1>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createBuilding.mutate(name.trim());
        }}
      >
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Add a building or house (e.g. Home, Church)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700">Add</button>
      </form>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {buildings?.length === 0 && (
        <p className="text-gray-500">No buildings yet. Add one above, or accept a share invite link.</p>
      )}
      <ul className="space-y-2">
        {buildings?.map((b) => (
          <li key={b.id}>
            <Link
              to={`/buildings/${b.id}`}
              className="block bg-white rounded-lg shadow-sm border px-4 py-3 hover:border-brand-500"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
