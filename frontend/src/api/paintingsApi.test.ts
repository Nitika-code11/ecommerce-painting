// Tests of the API client functions with a fake fetch: the URLs and bodies they send, how they validate what
// comes back, and how failures (HTTP errors, bad data, no network) are reported.
import { describe, expect, it } from "vitest";
import { jsonResponse, mockFetch, pageOf, sunset } from "@/test/utils";
import { ApiError } from "./http";
import { createPainting, deletePainting, getPainting, listPaintings, updatePainting } from "./paintingsApi";

describe("paintingsApi", () => {
  it("lists a page of paintings and passes the title search as a query param", async () => {
    const fetchMock = mockFetch(() => jsonResponse(pageOf([sunset])));
    await expect(listPaintings({ title: " sun set " })).resolves.toEqual(pageOf([sunset]));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/paintings?title=sun+set");
  });

  it("requests the given zero-based page", async () => {
    const fetchMock = mockFetch(() => jsonResponse(pageOf([sunset], { page: 2, totalElements: 30, totalPages: 3 })));
    await listPaintings({ title: "a", page: 2 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/paintings?title=a&page=2");
  });

  it("omits the query params for a blank search on the first page", async () => {
    const fetchMock = mockFetch(() => jsonResponse(pageOf([])));
    await listPaintings({ title: "  ", page: 0 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/paintings");
  });

  it("rejects invalid response data instead of trusting it", async () => {
    mockFetch(() => jsonResponse(pageOf([{ id: "1", title: "Bad" } as never])));
    await expect(listPaintings()).rejects.toMatchObject({ kind: "invalid-data" });
  });

  it("rejects a bare array (the pre-pagination format)", async () => {
    mockFetch(() => jsonResponse([sunset]));
    await expect(listPaintings()).rejects.toMatchObject({ kind: "invalid-data" });
  });

  it("rejects non-JSON success responses", async () => {
    mockFetch(() => new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html" } }));
    await expect(listPaintings()).rejects.toMatchObject({ kind: "invalid-data" });
  });

  it("maps HTTP errors to safe messages", async () => {
    mockFetch(() => new Response("java.lang.NullPointerException at ...", { status: 500 }));
    const error = await getPainting(1).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).not.toMatch(/NullPointer/);
  });

  it("flags 404s as not found", async () => {
    mockFetch(() => jsonResponse({ status: 404, error: "Not Found" }, 404));
    await expect(getPainting(99)).rejects.toMatchObject({ isNotFound: true });
  });

  it("reports network failures", async () => {
    mockFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    await expect(listPaintings()).rejects.toMatchObject({ kind: "network" });
  });

  it("sends JSON bodies for create and update", async () => {
    const fetchMock = mockFetch((_url, init) => jsonResponse({ ...sunset, ...JSON.parse(String(init.body)) }, init.method === "POST" ? 201 : 200));
    const input = { title: "New", artist: "Me", price: 10, stock: 1 };

    await expect(createPainting(input)).resolves.toMatchObject({ title: "New" });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });

    await updatePainting(1, input);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/paintings/1");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PUT" });
  });

  it("surfaces backend field errors on 400", async () => {
    mockFetch(() => jsonResponse({ status: 400, fieldErrors: { title: "must not be blank" } }, 400));
    await expect(createPainting({ title: "", artist: "x", price: 1, stock: 1 })).rejects.toMatchObject({
      fieldErrors: { title: "must not be blank" },
    });
  });

  it("handles 204 No Content on delete", async () => {
    const fetchMock = mockFetch(() => new Response(null, { status: 204 }));
    await expect(deletePainting(1)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });
});
