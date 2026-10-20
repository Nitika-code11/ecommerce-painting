import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { harbour, jsonResponse, mockFetch, pageOf, renderRoute, sunset } from "@/test/utils";

describe("PaintingListPage", () => {
  it("shows a loading state, then the catalogue", async () => {
    mockFetch(() => jsonResponse(pageOf([sunset, harbour])));
    renderRoute("/paintings");
    expect(screen.getByText("Loading paintings…")).toBeInTheDocument();
    const list = await screen.findByRole("list");
    expect(within(list).getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("2 paintings")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it("redirects / to the catalogue", async () => {
    mockFetch(() => jsonResponse(pageOf([sunset])));
    const router = renderRoute("/");
    await screen.findByText("Sunset Over Hills");
    expect(router.state.location.pathname).toBe("/paintings");
  });

  it("shows an empty state", async () => {
    mockFetch(() => jsonResponse(pageOf([])));
    renderRoute("/paintings");
    expect(await screen.findByRole("heading", { name: "No paintings yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add the first painting" })).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    let calls = 0;
    mockFetch(() => (++calls === 1 ? new Response("", { status: 503 }) : jsonResponse(pageOf([sunset]))));
    renderRoute("/paintings");
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load paintings/i);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Sunset Over Hills")).toBeInTheDocument();
  });

  it("treats malformed data as an error, not a painting", async () => {
    mockFetch(() => jsonResponse([sunset]));
    renderRoute("/paintings");
    expect(await screen.findByRole("alert")).toHaveTextContent(/unexpected format/i);
    expect(screen.queryByText("Sunset Over Hills")).not.toBeInTheDocument();
  });

  it("searches by title using the backend query param and reflects it in the URL", async () => {
    const fetchMock = mockFetch((url) => jsonResponse(pageOf(url.includes("title=") ? [] : [sunset])));
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
    mockFetch(() => jsonResponse(pageOf([])));
    renderRoute("/paintings", { enableMutations: false });
    await screen.findByRole("heading", { name: "No paintings yet" });
    expect(screen.queryByRole("link", { name: /add/i })).not.toBeInTheDocument();
  });

  describe("pagination", () => {
    const paged = (url: string) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page") ?? 0);
      return jsonResponse(pageOf(page === 0 ? [sunset] : [harbour], { page, totalElements: 13, totalPages: 2 }));
    };

    it("shows the total count and page controls, and moves between pages", async () => {
      const fetchMock = mockFetch(paged);
      const router = renderRoute("/paintings");
      await screen.findByText("Sunset Over Hills");

      expect(screen.getByText("13 paintings")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

      await userEvent.click(screen.getByRole("button", { name: /next/i }));

      expect(await screen.findByText("Harbour at Dawn")).toBeInTheDocument();
      expect(router.state.location.search).toBe("?page=2");
      expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/paintings?page=1");
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();

      await userEvent.click(screen.getByRole("button", { name: /previous/i }));
      expect(await screen.findByText("Sunset Over Hills")).toBeInTheDocument();
      expect(router.state.location.search).toBe("");
    });

    it("opens directly on the page given in the URL and keeps the search term", async () => {
      const fetchMock = mockFetch(paged);
      renderRoute("/paintings?title=a&page=2");
      expect(await screen.findByText("Harbour at Dawn")).toBeInTheDocument();
      expect(fetchMock.mock.calls[0][0]).toBe("/api/paintings?title=a&page=1");
    });

    it("offers a way back when the requested page is past the end", async () => {
      mockFetch((url) =>
        jsonResponse(url.includes("page=") ? pageOf([], { page: 5, totalElements: 13, totalPages: 2 }) : pageOf([sunset])),
      );
      renderRoute("/paintings?page=6");
      expect(await screen.findByRole("heading", { name: "That page doesn't exist" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Back to the first page" }));
      expect(await screen.findByText("Sunset Over Hills")).toBeInTheDocument();
    });
  });
});
