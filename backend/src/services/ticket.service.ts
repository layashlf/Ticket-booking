import { prisma } from "../../prisma/prisma";
import { TicketDTO, TicketTierName } from "../types";

/**
 * Read-only ticket catalog.
 * Safe to scale via caching/CDN.
 */
export async function getTicketCatalog(): Promise<TicketDTO[] | void> {
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
