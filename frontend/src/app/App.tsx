import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { buildRoutes } from "./router";

// The router uses the browser's History API so URLs look like /paintings/3 (no # in them).
// It is created once, outside the component, so it survives re-renders.
const router = createBrowserRouter(buildRoutes());

/** Root component: hands control to the router, which renders the page matching the current URL. */
export function App() {
  return <RouterProvider router={router} />;
}
