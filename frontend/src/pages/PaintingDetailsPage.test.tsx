import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { harbour, jsonResponse, mockFetch, renderRoute, sunset } from "@/test/utils";

describe("PaintingDetailsPage", () => {
  it("shows painting details", async () => {
    mockFetch(() => jsonResponse(sunset));
    renderRoute("/paintings/1");
    expect(await screen.findByRole("heading", { level: 1, name: "Sunset Over Hills" })).toBeInTheDocument();
    expect(screen.getByText("Acrylic on canvas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/paintings/1/edit");
  });

  it("handles a missing description", async () => {
    mockFetch(() => jsonResponse(harbour));
    renderRoute("/paintings/2");
    expect(await screen.findByText("No description provided.")).toBeInTheDocument();
  });

  it("shows not-found for unknown IDs", async () => {
    mockFetch(() => jsonResponse({ status: 404 }, 404));
    renderRoute("/paintings/999");
    expect(await screen.findByRole("heading", { name: "Not found" })).toBeInTheDocument();
  });

  it("shows not-found for non-numeric IDs without calling the API", async () => {
    const fetchMock = mockFetch(() => jsonResponse(sunset));
    renderRoute("/paintings/abc");
    expect(await screen.findByRole("heading", { name: "Not found" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirms before deleting, then returns to the catalogue with a confirmation", async () => {
    const fetchMock = mockFetch((url, init) => {
      if (init.method === "DELETE") return new Response(null, { status: 204 });
      return url.endsWith("/1") ? jsonResponse(sunset) : jsonResponse([]);
    });
    const router = renderRoute("/paintings/1");
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Delete “Sunset Over Hills”?");
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Delete painting" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/paintings"));
    expect(await screen.findByRole("status", { name: "" })).toBeTruthy();
    expect(screen.getByText("“Sunset Over Hills” was deleted.")).toBeInTheDocument();
  });

  it("can cancel deletion with the keyboard", async () => {
    const fetchMock = mockFetch(() => jsonResponse(sunset));
    renderRoute("/paintings/1");
    const deleteButton = await screen.findByRole("button", { name: "Delete" });
    deleteButton.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
  });

  it("keeps the dialog open and shows an error when delete fails", async () => {
    mockFetch((_url, init) => (init.method === "DELETE" ? new Response("", { status: 500 }) : jsonResponse(sunset)));
    renderRoute("/paintings/1");
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete painting" }));
    expect(await screen.findByText(/server ran into a problem/i)).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("hides edit and delete when mutations are disabled", async () => {
    mockFetch(() => jsonResponse(sunset));
    renderRoute("/paintings/1", { enableMutations: false });
    await screen.findByRole("heading", { level: 1, name: "Sunset Over Hills" });
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });
});
