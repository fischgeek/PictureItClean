import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireAuth } from "./components/RequireAuth";
import { AdminAssignmentsPage } from "./pages/AdminAssignmentsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AreaPage } from "./pages/AreaPage";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { LoginPage } from "./pages/LoginPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { SpacePage } from "./pages/SpacePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/properties"
        element={
          <RequireAuth>
            <PropertiesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/buildings/:buildingId"
        element={
          <RequireAuth>
            <BuildingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/areas/:areaId"
        element={
          <RequireAuth>
            <AreaPage />
          </RequireAuth>
        }
      />
      <Route
        path="/spaces/:spaceId"
        element={
          <RequireAuth>
            <SpacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/invite/:token"
        element={
          <RequireAuth>
            <InviteAcceptPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/assignments"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminAssignmentsPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
