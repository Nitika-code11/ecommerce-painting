import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { buildRoutes } from "./router";

const router = createBrowserRouter(buildRoutes());

export function App() {
  return <RouterProvider router={router} />;
}
