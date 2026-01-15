import type { TicketDTO } from "~/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchTickets(): Promise<TicketDTO[]> {
  const res = await fetch(`${API_BASE}/api/tickets`);
  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return res.json();
}

export async function bookTicket(
  tier: string,
  quantity: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, quantity }),
  });

  if (!res.ok) {
    throw new Error("Booking failed");
  }
}
