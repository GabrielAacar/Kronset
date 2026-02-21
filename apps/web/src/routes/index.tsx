import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import ConnectionsPage from "@/pages/ConnectionsPage";

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
    ],
  },
]);
