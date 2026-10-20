// Component test: what a single catalogue card shows (title, price, stock, image or placeholder).
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { harbour, sunset } from "@/test/utils";
import { PaintingCard } from "./PaintingCard";

// The card contains a router <Link>, so it must be rendered inside a router (an in-memory one for tests).
const renderCard = (painting = sunset) =>
  render(
    <MemoryRouter>
      <PaintingCard painting={painting} />
    </MemoryRouter>,
  );

describe("PaintingCard", () => {
  it("shows title, artist, price, stock and links to details", () => {
    renderCard();
    expect(screen.getByRole("link", { name: "Sunset Over Hills" })).toHaveAttribute("href", "/paintings/1");
    expect(screen.getByText("by A. Sharma")).toBeInTheDocument();
    expect(screen.getByText("₹4,500.00")).toBeInTheDocument();
    expect(screen.getByText("3 in stock")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Sunset Over Hills" })).toHaveAttribute("src", sunset.imageUrl);
  });

  it("shows a placeholder when there is no image, and a sold-out label in text", () => {
    renderCard(harbour);
    expect(screen.getByRole("img", { name: /no image available/i })).toBeInTheDocument();
    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });

  it("falls back to the placeholder when the image fails to load", () => {
    renderCard();
    fireEvent.error(screen.getByRole("img", { name: "Sunset Over Hills" }));
    expect(screen.getByRole("img", { name: /no image available/i })).toBeInTheDocument();
  });
});
