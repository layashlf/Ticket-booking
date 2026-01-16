import { BookingStatus, TicketTierName } from "@prisma/client";
import { prisma } from "../../prisma/prisma";
import { BookingResponse, BookRequest, TicketDTO } from "../types";

/**
 * Read-only ticket catalog.
 * Safe to scale via caching/CDN.
 */
export async function getTicketCatalog(): Promise<TicketDTO[]> {
  const tiers = await prisma.ticketTier.findMany({
    include: { inventory: true },
  });

  return tiers.map((tier: any) => {
    const name = tier.name as TicketTierName;

    return {
      id: tier.id,
      name,
      price: tier.price,
      quantityAvailable: tier.inventory?.quantityAvailable ?? 0,
    };
  });
}

export async function bookTickets(
  request: BookRequest
): Promise<BookingResponse> {
  const { tier, quantity, userId = "mock-user" } = request;

  // Fail early on payment simulation
  if (Math.random() <= 0.1) {
    throw new Error("Payment failed");
  }

  return prisma.$transaction(
    async (tx) => {
      // Lock and Fetch in one atomic step to ensure it reads the latest locked state
      const ticketTier = await tx.ticketTier.findUniqueOrThrow({
        where: { name: tier },
        include: { inventory: true },
      });

      // Explicit lock on inventory row
      await tx.$executeRaw`
        SELECT 1
        FROM "TicketInventory"
        WHERE "tierId" = ${ticketTier.id}
        FOR UPDATE
      `;

      if (
        !ticketTier.inventory ||
        ticketTier.inventory.quantityAvailable < quantity
      ) {
        throw new Error("Not enough tickets available");
      }

      // Create booking and update inventory
      const booking = await tx.booking.create({
        data: {
          userId,
          status: BookingStatus.CONFIRMED,
          items: {
            create: {
              tierId: ticketTier.id,
              quantity,
              price: ticketTier.price,
            },
          },
        },
        include: {
          items: {
            include: { tier: true },
          },
        },
      });

      await tx.ticketInventory.update({
        where: { tierId: ticketTier.id },
        data: {
          quantityAvailable: {
            decrement: quantity,
          },
        },
      });

      return {
        bookingId: booking.id,
        status: booking.status,
        items: booking.items.map((item) => ({
          tier: item.tier.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    },
    { isolationLevel: "Serializable" }
  );
}
