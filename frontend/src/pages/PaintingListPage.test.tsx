import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { harbour, jsonResponse, mockFetch, renderRoute, sunset } from "@/test/utils";

describe("PaintingListPage", () => {
  it("shows a loading state, then the catalogue", async () => {
    mockFetch(() => jsonResponse([sunset, harbour]));
    renderRoute("/paintings");
    expect(screen.getByText("Loading paintings…")).toBeInTheDocument();
    const list = await screen.findByRole("list");
    expect(within(list).getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("2 paintings")).toBeInTheDocument();
  });

  it("redirects / to the catalogue", async () => {
    mockFetch(() => jsonResponse([sunset]));
    const router = renderRoute("/");
    await screen.findByText("Sunset Over Hills");
    expect(router.state.location.pathname).toBe("/paintings");
  });

  it("shows an empty state", async () => {
    mockFetch(() => jsonResponse([]));
    renderRoute("/paintings");
    expect(await screen.findByRole("heading", { name: "No paintings yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add the first painting" })).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    let calls = 0;
    mockFetch(() => (++calls === 1 ? new Response("", { status: 503 }) : jsonResponse([sunset])));
    renderRoute("/paintings");
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load paintings/i);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Sunset Over Hills")).toBeInTheDocument();
  });

  it("treats malformed data as an error, not a painting", async () => {
    mockFetch(() => jsonResponse({ content: [sunset] }));
    renderRoute("/paintings");
    expect(await screen.findByRole("alert")).toHaveTextContent(/unexpected format/i);
    expect(screen.queryByText("Sunset Over Hills")).not.toBeInTheDocument();
  });

  it("searches by title using the backend query param and reflects it in the URL", async () => {
    const fetchMock = mockFetch((url) => jsonResponse(url.includes("title=") ? [] : [sunset]));
    const router = renderRoute("/paintings");
    await screen.findByText("Sunset Over Hills");

    await userEvent.type(screen.getByRole("searchbox", { name: /search paintings/i }), "moon{Enter}");

    expect(await screen.findByRole("heading", { name: /no paintings match “moon”/i })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?title=moon");
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url === "/api/paintings?title=moon")).toBe(true));

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(await screen.findByText("Sunset Over Hills")).toBeInTheDocument();
  });

  it("hides create controls when mutations are disabled", async () => {
    mockFetch(() => jsonResponse([]));
    renderRoute("/paintings", { enableMutations: false });
    await screen.findByRole("heading", { name: "No paintings yet" });
    expect(screen.queryByRole("link", { name: /add/i })).not.toBeInTheDocument();
  });
});
