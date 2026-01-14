import { BookingStatus, TicketTierName } from "@prisma/client";

export interface TicketDTO {
  id: string;
  name: TicketTierName;
  price: number;
  quantityAvailable: number;
}

export interface BookRequest {
  tier: TicketTierName;
  quantity: number;
  userId?: string;
}

export interface BookingItemDTO {
  tier: TicketTierName;
  quantity: number;
  price: number;
}

export interface BookingResponse {
  bookingId: string;
  status: BookingStatus;
  items: BookingItemDTO[];
}
