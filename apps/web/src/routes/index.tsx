import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import DatasetsPage from "@/pages/DatasetsPage";
import DimensionsPage from "@/pages/DimensionsPage";
import MetricsPage from "@/pages/MetricsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
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
    ],
  },
]);
