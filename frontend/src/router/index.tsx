import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout/MainLayout";
import LeadsPage from "@/pages/leads";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/leads" replace /> },
  {
    path: "/leads",
    element: (
      <MainLayout>
        <LeadsPage />
      </MainLayout>
    ),
  },
]);
