import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { api, ResourceType } from "../api/client";
import { Layout } from "../components/Layout";

type Key = `${ResourceType}:${string}`;
const key = (resourceType: ResourceType, resourceId: string): Key => `${resourceType}:${resourceId}`;

export function AdminAssignmentsPage() {
  const queryClient = useQueryClient();
  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: api.listUsers });
  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ["assignment-options"],
    queryFn: api.listAssignmentOptions,
  });

  const [userId, setUserId] = useState<string>("");
  const [checked, setChecked] = useState<Set<Key>>(new Set());
  const [saved, setSaved] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["user-assignments", userId],
    queryFn: () => api.getUserAssignments(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (existing) {
      setChecked(new Set(existing.map((a) => key(a.resourceType, a.resourceId))));
      setSaved(false);
    }
  }, [existing]);

  useEffect(() => {
    if (!userId && users && users.length > 0) setUserId(users[0].id);
  }, [users, userId]);

  const save = useMutation({
    mutationFn: () => {
      const items = Array.from(checked).map((k) => {
        const [resourceType, resourceId] = k.split(":") as [ResourceType, string];
        return { resourceType, resourceId };
      });
      return api.setUserAssignments(userId, items);
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["user-assignments", userId] });
      setTimeout(() => setSaved(false), 8000);
    },
  });

  const toggle = (k: Key, descendants: Key[] = []) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const turningOn = !next.has(k);
      const affected = [k, ...descendants];
      for (const a of affected) {
        if (turningOn) next.add(a);
        else next.delete(a);
      }
      return next;
    });
  };

  return (
    <Layout>
      <h1 className="text-2xl font-semibold tracking-tight mb-4 text-slate-800 dark:text-slate-100">Assignments</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Choose which buildings, areas, or spaces each user is responsible for. They'll receive a random pick from
        their assigned spaces on their dashboard, weighted toward whatever is most overdue.
      </p>

      <div className="card-glass p-4 mb-4">
        <label className="label-glass">User</label>
        <select className="input-glass" value={userId} onChange={(e) => setUserId(e.target.value)}>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName} (@{u.username})
            </option>
          ))}
        </select>
      </div>

      {optionsLoading && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}

      <div className="card-glass p-4 mb-4 space-y-3">
        {[...(options ?? [])]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((building) => {
          const buildingDescendants: Key[] = building.areas.flatMap((area) => [
            key("area", area.id),
            ...area.spaces.map((s) => key("space", s.id)),
          ]);
          return (
            <div key={building.id}>
              <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand-500"
                  checked={checked.has(key("building", building.id))}
                  onChange={() => toggle(key("building", building.id), buildingDescendants)}
                />
                {building.name}
              </label>
              <div className="ml-6 mt-1 space-y-1">
                {[...building.areas]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((area) => {
                  const areaDescendants: Key[] = area.spaces.map((s) => key("space", s.id));
                  return (
                    <div key={area.id}>
                      <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-brand-500"
                          checked={checked.has(key("area", area.id))}
                          onChange={() => toggle(key("area", area.id), areaDescendants)}
                        />
                        {area.name}
                      </label>
                      <div className="ml-6 mt-1 space-y-1">
                        {[...area.spaces]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((space) => (
                          <label key={space.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-brand-500"
                              checked={checked.has(key("space", space.id))}
                              onChange={() => toggle(key("space", space.id))}
                            />
                            {space.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button disabled={!userId || save.isPending} className="btn-primary" onClick={() => save.mutate()}>
        Save assignments
      </button>
      {saved && <span className="ml-3 text-brand-600 dark:text-brand-400 text-sm">Saved!</span>}
    </Layout>
  );
}
