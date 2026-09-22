import { createBrowserRouter, Navigate } from "react-router-dom";
import LeadsPage from "@/pages/leads/LeadsPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/leads" replace /> },
  { path: "/leads", element: <LeadsPage /> },
]);
