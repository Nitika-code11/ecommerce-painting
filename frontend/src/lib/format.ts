// The README's sample data uses rupee prices; change the locale/currency here if needed.
// Intl.NumberFormat is created once and reused, because constructing it is relatively expensive.
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/** Formats a number as money, e.g. 4500 becomes "₹4,500.00" (Indian digit grouping). */
export function formatPrice(value: number): string {
  return currency.format(value);
}
