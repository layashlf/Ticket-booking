import React, { useEffect, useState } from "react";
import { fetchTickets, bookTicket } from "../api/tickets";
import type { TicketDTO, TicketTierName } from "~/types";

/**
 * UI-specific tier identifiers.
 * Intentionally separate from backend enums to keep UI flexible.
 */
type UiTier = "vip" | "frontRow" | "ga";

interface Availability {
  vip: number;
  frontRow: number;
  ga: number;
}

const TIER_CONFIG: Record<
  UiTier,
  { label: string; price: number; apiTier: TicketTierName }
> = {
  vip: { label: "VIP", price: 100, apiTier: "VIP" },
  frontRow: { label: "Front Row", price: 50, apiTier: "FRONT_ROW" },
  ga: { label: "General Admission", price: 10, apiTier: "GA" },
};

const INITIAL_QUANTITIES: Record<UiTier, number> = {
  vip: 0,
  frontRow: 0,
  ga: 0,
};

const TicketBooking: React.FC = () => {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [quantities, setQuantities] =
    useState<Record<UiTier, number>>(INITIAL_QUANTITIES);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    try {
      const tickets = await fetchTickets();
      setAvailability(mapAvailability(tickets));
    } catch {
      setMessage({
        type: "error",
        text: "Failed to load ticket availability.",
      });
    }
  }

  function mapAvailability(tickets: TicketDTO[]): Availability {
    const result: Availability = { vip: 0, frontRow: 0, ga: 0 };

    for (const ticket of tickets) {
      switch (ticket.name) {
        case "VIP":
          result.vip = ticket.quantityAvailable;
          break;
        case "FRONT_ROW":
          result.frontRow = ticket.quantityAvailable;
          break;
        case "GA":
          result.ga = ticket.quantityAvailable;
          break;
      }
    }

    return result;
  }

  function handleQuantityChange(tier: UiTier, value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    const max = availability?.[tier] ?? 0;

    setQuantities((prev) => ({
      ...prev,
      [tier]: Math.min(parsed, max),
    }));
  }

  async function handleBooking() {
    setLoading(true);
    setMessage(null);

    const selectedTiers = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([tier, qty]) => ({
        tier: TIER_CONFIG[tier as UiTier].apiTier,
        quantity: qty,
      }));

    if (selectedTiers.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one ticket.",
      });
      setLoading(false);
      return;
    }

    try {
      /**
       * Each tier is booked independently.
       */
      const results = await Promise.allSettled(
        selectedTiers.map(({ tier, quantity }) => bookTicket(tier, quantity))
      );

      const failed = results.some((r) => r.status === "rejected");

      if (failed) {
        setMessage({
          type: "error",
          text: "Booking failed. Some tickets may have sold out.",
        });
      } else {
        setMessage({
          type: "success",
          text: "Tickets booked successfully!",
        });
        setQuantities(INITIAL_QUANTITIES);
        await loadAvailability();
      }
    } catch {
      setMessage({
        type: "error",
        text: "Unexpected error during booking.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!availability) {
    return (
      <div className="flex justify-center py-12 text-gray-600">
        Loading ticket availability…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Concert Ticket Booking
      </h1>

      {message && (
        <div
          className={`mb-6 rounded border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-5">
        {(Object.keys(TIER_CONFIG) as UiTier[]).map((tier) => (
          <div
            key={tier}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {TIER_CONFIG[tier].label}
                </h3>
                <p className="text-sm text-gray-600">
                  ${TIER_CONFIG[tier].price} per ticket
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Available: {availability[tier]}
                </p>
              </div>

              <input
                type="number"
                min={0}
                max={availability[tier]}
                value={quantities[tier]}
                onChange={(e) => handleQuantityChange(tier, e.target.value)}
                className="w-20 rounded border border-gray-300 px-2 py-1 text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleBooking}
        disabled={loading}
        className="mt-8 w-full rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "Booking…" : "Book Tickets"}
      </button>
    </div>
  );
};

export default TicketBooking;
