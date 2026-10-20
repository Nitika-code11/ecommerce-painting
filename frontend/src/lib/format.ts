// The README's sample data uses rupee prices; change the locale/currency here if needed.
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function formatPrice(value: number): string {
  return currency.format(value);
}
