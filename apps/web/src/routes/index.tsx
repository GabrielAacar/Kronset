import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import DatasetsPage from "@/pages/DatasetsPage";
import DimensionsPage from "@/pages/DimensionsPage";
import MetricsPage from "@/pages/MetricsPage";
import DashboardsPage from "@/pages/DashboardsPage";
import DashboardBuilderPage from "@/pages/DashboardBuilderPage";
import DashboardViewPage from "@/pages/DashboardViewPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "connections",
        element: <ConnectionsPage />,
      },
      {
        path: "datasets",
        element: <DatasetsPage />,
      },
      {
        path: "dimensions",
        element: <DimensionsPage />,
      },
      {
        path: "metrics",
        element: <MetricsPage />,
      },
      {
        path: "dashboards",
        element: <DashboardsPage />,
      },
      {
        path: "dashboards/:id/edit",
        element: <DashboardBuilderPage />,
      },
    ],
  },
  {
    path: "/view/:slug",
    element: <DashboardViewPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
