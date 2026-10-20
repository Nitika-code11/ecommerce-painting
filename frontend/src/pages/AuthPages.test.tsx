// Tests of who sees what: navigation controls per role, the admin-only route guard, and the sign-in page
// (success, wrong password, empty fields, and refusing unsafe redirect targets). The server is faked.
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getToken } from "@/lib/auth";
import { jsonResponse, makeToken, mockFetch, pageOf, renderRoute, sunset } from "@/test/utils";

// A fake backend answer for the catalogue: one page containing one painting.
const catalogue = () => jsonResponse(pageOf([sunset]));

describe("navigation by role", () => {
  it("guests see Sign in but no management controls", async () => {
    mockFetch(catalogue);
    renderRoute("/paintings", { signedInAs: null });
    await screen.findByText("Sunset Over Hills");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /add painting/i })).not.toBeInTheDocument();
  });

  it("customers are signed in but get no management controls", async () => {
    mockFetch(catalogue);
    renderRoute("/paintings", { signedInAs: "CUSTOMER" });
    await screen.findByText("Sunset Over Hills");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /add painting/i })).not.toBeInTheDocument();
  });

  it("admins see Add painting, and edit/delete on a painting", async () => {
    mockFetch((url) => (url.endsWith("/api/paintings/1") ? jsonResponse(sunset) : catalogue()));
    renderRoute("/paintings/1", { signedInAs: "ADMIN" });
    expect(await screen.findByRole("link", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add painting/i })).toBeInTheDocument();
  });

  it("guests and customers see a painting without edit/delete", async () => {
    mockFetch(() => jsonResponse(sunset));
    renderRoute("/paintings/1", { signedInAs: "CUSTOMER" });
    await screen.findByRole("heading", { name: "Sunset Over Hills" });
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("signing out removes the token and the admin controls", async () => {
    mockFetch(catalogue);
    renderRoute("/paintings", { signedInAs: "ADMIN" });
    await userEvent.click(await screen.findByRole("button", { name: /sign out/i }));
    expect(getToken()).toBeNull();
    expect(await screen.findByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /add painting/i })).not.toBeInTheDocument();
  });

  it("hides the sign-in link entirely when management is disabled for the environment", async () => {
    mockFetch(catalogue);
    renderRoute("/paintings", { signedInAs: null, enableMutations: false });
    await screen.findByText("Sunset Over Hills");
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });
});

describe("route guard", () => {
  it("sends guests from a management page to sign in, remembering where they were going", async () => {
    mockFetch(catalogue);
    const router = renderRoute("/paintings/new", { signedInAs: null });
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe("?next=%2Fpaintings%2Fnew");
  });

  it("shows customers a 403 instead of the form", async () => {
    mockFetch(catalogue);
    renderRoute("/paintings/new", { signedInAs: "CUSTOMER" });
    expect(await screen.findByRole("heading", { name: "Not allowed" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /add a painting|new painting/i })).not.toBeInTheDocument();
  });

  it("guards the edit page too", async () => {
    mockFetch(catalogue);
    renderRoute("/paintings/1/edit", { signedInAs: null });
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });
});

describe("sign-in page", () => {
  // Types into the two fields and clicks the Sign in button, like a person would.
  const credentials = async (username: string, password: string) => {
    await userEvent.type(screen.getByLabelText("Username"), username);
    await userEvent.type(screen.getByLabelText("Password"), password);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  };

  it("signs in and goes to the page the user was heading to", async () => {
    const token = makeToken({ username: "boss", roles: ["ADMIN"] });
    const fetchMock = mockFetch((url) =>
      url === "/api/auth/login" ? jsonResponse({ accessToken: token, tokenType: "Bearer", expiresIn: 3600 }) : catalogue(),
    );
    const router = renderRoute("/login?next=%2Fpaintings%2Fnew", { signedInAs: null });

    await credentials("boss", "admin-password");

    await waitForPath(router, "/paintings/new");
    expect(getToken()).toBe(token);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ username: "boss", password: "admin-password" });
  });

  it("shows a clear message for wrong credentials and stays signed out", async () => {
    mockFetch(() => jsonResponse({ status: 401, message: "Invalid username or password" }, 401));
    renderRoute("/login", { signedInAs: null });

    await credentials("boss", "nope");

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect username or password.");
    expect(getToken()).toBeNull();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("asks for both fields before calling the server", async () => {
    const fetchMock = mockFetch(catalogue);
    renderRoute("/login", { signedInAs: null });

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your username and password/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["//evil.test", "https://evil.test", "/login", "javascript:alert(1)"])(
    "never redirects to an unsafe destination (%s)",
    async (next) => {
      mockFetch(catalogue);
      const router = renderRoute(`/login?next=${encodeURIComponent(next)}`, { signedInAs: "ADMIN" });
      await waitForPath(router, "/paintings");
    },
  );

  it("redirects an already signed-in user away from the sign-in page", async () => {
    mockFetch(catalogue);
    const router = renderRoute("/login", { signedInAs: "ADMIN" });
    await waitForPath(router, "/paintings");
  });
});

function waitForPath(router: ReturnType<typeof renderRoute>, path: string) {
  return waitFor(() => expect(router.state.location.pathname).toBe(path));
}
