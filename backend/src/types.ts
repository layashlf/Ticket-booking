export type TicketTierName = "VIP" | "FRONT_ROW" | "GA";

export interface TicketDTO {
  id: string;
  name: TicketTierName;
  price: number;
  quantityAvailable: number;
}
