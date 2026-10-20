import { Navigate, type RouteObject } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RequireAdmin } from "@/components/RequireAdmin";
import { mutationsEnabled, MutationsProvider } from "@/lib/config";
import { PaintingListPage } from "@/pages/PaintingListPage";
import { PaintingDetailsPage } from "@/pages/PaintingDetailsPage";
import { CreatePaintingPage } from "@/pages/CreatePaintingPage";
import { EditPaintingPage } from "@/pages/EditPaintingPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * The map from URL to page. Every page is a child of the Layout route, so the header and footer are shared.
 * It is a function (not a constant) so tests can build the same routes with management switched on or off.
 *
 * @param enableMutations false hides sign-in and every create/edit/delete route (read-only deployment)
 */
export function buildRoutes(enableMutations = mutationsEnabled): RouteObject[] {
  return [
    {
      // Layout wraps all pages; MutationsProvider tells every component below whether management is enabled.
      element: (
        <MutationsProvider value={enableMutations}>
          <Layout />
        </MutationsProvider>
      ),
      children: [
        { path: "/", element: <Navigate to="/paintings" replace /> }, // the home page is the catalogue
        { path: "/paintings", element: <PaintingListPage /> },        // public
        ...(enableMutations
          ? [
              { path: "/login", element: <LoginPage /> },
              // RequireAdmin sends guests to /login and shows a 403 page to non-admins.
              { path: "/paintings/new", element: <RequireAdmin><CreatePaintingPage /></RequireAdmin> },
            ]
          : []),
        { path: "/paintings/:id", element: <PaintingDetailsPage /> }, // public; ":id" is read with useParams()
        ...(enableMutations ? [{ path: "/paintings/:id/edit", element: <RequireAdmin><EditPaintingPage /></RequireAdmin> }] : []),
        { path: "*", element: <NotFoundPage /> }, // anything else
      ],
    },
  ];
}
