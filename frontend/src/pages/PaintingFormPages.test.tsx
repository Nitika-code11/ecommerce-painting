import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { jsonResponse, mockFetch, renderRoute, sunset } from "@/test/utils";

describe("CreatePaintingPage", () => {
  it("validates fields, links errors to inputs and focuses the first invalid one", async () => {
    const fetchMock = mockFetch(() => jsonResponse(sunset, 201));
    renderRoute("/paintings/new");
    await userEvent.type(screen.getByLabelText(/price/i), "-3");
    await userEvent.click(screen.getByRole("button", { name: "Add painting" }));

    const title = screen.getByLabelText(/title/i);
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription(/title is required/i);
    expect(title).toHaveFocus();
    expect(screen.getByLabelText(/price/i)).toHaveAccessibleDescription(/greater than zero/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a POST and navigates to the new painting with a confirmation", async () => {
    const fetchMock = mockFetch((_url, init) =>
      init.method === "POST" ? jsonResponse({ ...sunset, id: 7, title: "Moonrise" }, 201) : jsonResponse({ ...sunset, id: 7, title: "Moonrise" }),
    );
    const router = renderRoute("/paintings/new");
    await userEvent.type(screen.getByLabelText(/title/i), "  Moonrise ");
    await userEvent.type(screen.getByLabelText(/artist/i), "Amit");
    await userEvent.type(screen.getByLabelText(/price/i), "2500.50");
    await userEvent.type(screen.getByLabelText(/stock/i), "2");
    await userEvent.click(screen.getByRole("button", { name: "Add painting" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/paintings/7"));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ title: "Moonrise", artist: "Amit", price: 2500.5, stock: 2 });
    expect(await screen.findByText("“Moonrise” was added.")).toBeInTheDocument();
  });

  it("prevents duplicate submissions while saving", async () => {
    let resolve!: (r: Response) => void;
    const fetchMock = mockFetch(() => new Promise<Response>((r) => (resolve = r)));
    renderRoute("/paintings/new");
    await userEvent.type(screen.getByLabelText(/title/i), "A");
    await userEvent.type(screen.getByLabelText(/artist/i), "B");
    await userEvent.type(screen.getByLabelText(/price/i), "1");
    await userEvent.type(screen.getByLabelText(/stock/i), "1");
    await userEvent.click(screen.getByRole("button", { name: "Add painting" }));

    const saving = await screen.findByRole("button", { name: /adding/i });
    expect(saving).toBeDisabled();
    await userEvent.click(saving);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve(jsonResponse(sunset, 201));
  });

  it("shows server validation errors next to the field", async () => {
    mockFetch(() => jsonResponse({ status: 400, fieldErrors: { title: "Title already used" } }, 400));
    renderRoute("/paintings/new");
    await userEvent.type(screen.getByLabelText(/title/i), "A");
    await userEvent.type(screen.getByLabelText(/artist/i), "B");
    await userEvent.type(screen.getByLabelText(/price/i), "1");
    await userEvent.type(screen.getByLabelText(/stock/i), "1");
    await userEvent.click(screen.getByRole("button", { name: "Add painting" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/not accepted/i);
    expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(/title already used/i);
  });

  it("is not routable when mutations are disabled", async () => {
    mockFetch(() => jsonResponse(sunset));
    renderRoute("/paintings/new", { enableMutations: false });
    // Falls through to the details route, whose ID is invalid.
    expect(await screen.findByRole("heading", { name: "Not found" })).toBeInTheDocument();
  });
});

describe("EditPaintingPage", () => {
  it("prefills the form and submits a PUT", async () => {
    const fetchMock = mockFetch((_url, init) =>
      init.method === "PUT" ? jsonResponse({ ...sunset, ...JSON.parse(String(init.body)) }) : jsonResponse(sunset),
    );
    const router = renderRoute("/paintings/1/edit");

    const title = await screen.findByLabelText(/title/i);
    expect(title).toHaveValue("Sunset Over Hills");
    expect(screen.getByLabelText(/price/i)).toHaveValue("4500");

    await userEvent.clear(title);
    await userEvent.type(title, "Sunset II");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/paintings/1"));
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(put?.[0]).toBe("/api/paintings/1");
    expect(JSON.parse(String(put?.[1]?.body))).toMatchObject({ title: "Sunset II", imageUrl: sunset.imageUrl });
    expect(await screen.findByText("“Sunset II” was updated.")).toBeInTheDocument();
  });

  it("shows not-found when editing an unknown painting", async () => {
    mockFetch(() => jsonResponse({}, 404));
    renderRoute("/paintings/42/edit");
    expect(await screen.findByRole("heading", { name: "Not found" })).toBeInTheDocument();
  });
});

describe("unknown routes", () => {
  it("shows the not-found page", async () => {
    renderRoute("/nowhere");
    expect(await screen.findByRole("heading", { name: "Not found" })).toBeInTheDocument();
  });
});
