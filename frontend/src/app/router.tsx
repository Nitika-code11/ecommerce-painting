import { Navigate, type RouteObject } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { mutationsEnabled, MutationsProvider } from "@/lib/config";
import { PaintingListPage } from "@/pages/PaintingListPage";
import { PaintingDetailsPage } from "@/pages/PaintingDetailsPage";
import { CreatePaintingPage } from "@/pages/CreatePaintingPage";
import { EditPaintingPage } from "@/pages/EditPaintingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function buildRoutes(enableMutations = mutationsEnabled): RouteObject[] {
  return [
    {
      element: (
        <MutationsProvider value={enableMutations}>
          <Layout />
        </MutationsProvider>
      ),
      children: [
        { path: "/", element: <Navigate to="/paintings" replace /> },
        { path: "/paintings", element: <PaintingListPage /> },
        ...(enableMutations ? [{ path: "/paintings/new", element: <CreatePaintingPage /> }] : []),
        { path: "/paintings/:id", element: <PaintingDetailsPage /> },
        ...(enableMutations ? [{ path: "/paintings/:id/edit", element: <EditPaintingPage /> }] : []),
        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ];
}
