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
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">You've been invited!</h1>
        {isLoading && <p className="text-gray-500">Loading invite…</p>}
        {error && <p className="text-red-600">This invite link is invalid or expired.</p>}
        {invite && (
          <>
            <p className="text-gray-600 mb-4">
              Join <strong>{invite.resourceName}</strong> ({invite.resourceType}) as <strong>{invite.role}</strong>.
            </p>
            <button
              disabled={accept.isPending}
              className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
              onClick={() => accept.mutate()}
            >
              Accept invite
            </button>
            {accept.isError && <p className="text-red-600 text-sm mt-2">Failed to accept invite.</p>}
          </>
        )}
      </div>
    </Layout>
  );
}
