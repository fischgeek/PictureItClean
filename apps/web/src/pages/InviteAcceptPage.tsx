import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Layout } from "../components/Layout";

const resourcePath: Record<string, string> = { building: "buildings", area: "areas", space: "spaces" };

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data: invite, isLoading, error } = useQuery({ queryKey: ["invite", token], queryFn: () => api.getInvite(token!) });

  const accept = useMutation({
    mutationFn: () => api.acceptInvite(token!),
    onSuccess: () => {
      navigate(`/${resourcePath[invite!.resourceType]}/${invite!.resourceId}`);
    },
  });

  return (
    <Layout>
      <div className="card-glass p-6 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">You've been invited!</h1>
        {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading invite…</p>}
        {error && <p className="text-red-600 dark:text-red-400">This invite link is invalid or expired.</p>}
        {invite && (
          <>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Join <strong>{invite.resourceName}</strong> ({invite.resourceType}) as <strong>{invite.role}</strong>.
            </p>
            <button disabled={accept.isPending} className="btn-primary" onClick={() => accept.mutate()}>
              Accept invite
            </button>
            {accept.isError && <p className="text-red-600 dark:text-red-400 text-sm mt-2">Failed to accept invite.</p>}
          </>
        )}
      </div>
    </Layout>
  );
}
