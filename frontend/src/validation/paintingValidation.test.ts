import { describe, expect, it } from "vitest";
import { isPainting, isPaintingArray, toPaintingInput, validatePaintingForm, type PaintingFormValues } from "./paintingValidation";

const valid = { id: 1, title: "A", artist: "B", price: 10, stock: 0 };
const formValues: PaintingFormValues = { title: "Sunset", artist: "Amit", description: "", price: "2500", stock: "4", imageUrl: "" };

describe("isPainting", () => {
  it("accepts a valid painting with optional fields missing, null or strings", () => {
    expect(isPainting(valid)).toBe(true);
    expect(isPainting({ ...valid, description: null, imageUrl: null })).toBe(true);
    expect(isPainting({ ...valid, description: "x", imageUrl: "https://x.test/a.jpg" })).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "painting"],
    ["missing title", { ...valid, title: undefined }],
    ["string price", { ...valid, price: "10" }],
    ["string id", { ...valid, id: "1" }],
    ["fractional stock", { ...valid, stock: 1.5 }],
    ["numeric description", { ...valid, description: 5 }],
    ["object imageUrl", { ...valid, imageUrl: {} }],
  ])("rejects %s", (_label, data) => {
    expect(isPainting(data)).toBe(false);
  });
});

describe("isPaintingArray", () => {
  it("accepts arrays of paintings, including empty", () => {
    expect(isPaintingArray([])).toBe(true);
    expect(isPaintingArray([valid, { ...valid, id: 2 }])).toBe(true);
  });

  it("rejects wrapper objects and arrays containing invalid items", () => {
    expect(isPaintingArray({ content: [valid] })).toBe(false);
    expect(isPaintingArray([valid, { id: 2 }])).toBe(false);
  });
});

describe("validatePaintingForm", () => {
  it("passes valid values", () => {
    expect(validatePaintingForm(formValues)).toEqual({});
  });

  it("requires title and artist after trimming", () => {
    const errors = validatePaintingForm({ ...formValues, title: "   ", artist: "" });
    expect(errors.title).toMatch(/required/i);
    expect(errors.artist).toMatch(/required/i);
  });

  it.each(["", "abc", "0", "-5", "10.123"])("rejects price %j", (price) => {
    expect(validatePaintingForm({ ...formValues, price }).price).toBeDefined();
  });

  it.each(["", "-1", "1.5", "two"])("rejects stock %j", (stock) => {
    expect(validatePaintingForm({ ...formValues, stock }).stock).toBeDefined();
  });

  it("accepts zero stock", () => {
    expect(validatePaintingForm({ ...formValues, stock: "0" }).stock).toBeUndefined();
  });

  it("validates the image URL only when supplied", () => {
    expect(validatePaintingForm({ ...formValues, imageUrl: "not a url" }).imageUrl).toBeDefined();
    expect(validatePaintingForm({ ...formValues, imageUrl: "ftp://x.test/a.jpg" }).imageUrl).toBeDefined();
    expect(validatePaintingForm({ ...formValues, imageUrl: "https://x.test/a.jpg" }).imageUrl).toBeUndefined();
  });
});

describe("toPaintingInput", () => {
  it("trims text, converts numbers and omits empty optional fields", () => {
    expect(toPaintingInput({ ...formValues, title: " Sunset ", price: "2500.50" })).toEqual({
      title: "Sunset",
      artist: "Amit",
      price: 2500.5,
      stock: 4,
    });
  });
});
