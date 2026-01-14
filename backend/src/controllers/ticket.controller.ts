import { Request, Response } from "express";
import { getTicketCatalog, bookTickets } from "../services/ticket.service";
import { BookRequest, TicketDTO, BookingResponse } from "../types";

export class TicketController {
  // GET /api/tickets
  static async getTickets(
    _req: Request,
    res: Response<TicketDTO[] | { error: string }>
  ) {
    try {
      const tickets = await getTicketCatalog();
      res.json(tickets);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tickets";
      res.status(500).json({ error: message });
    }
  }

  // POST /api/book
  static async bookTickets(
    req: Request<{}, {}, BookRequest>,
    res: Response<BookingResponse | { error: string }>
  ) {
    const { tier, quantity } = req.body;

    if (!tier || quantity <= 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const booking = await bookTickets(req.body);
      res.json(booking);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Booking failed";
      res.status(409).json({ error: message });
    }
  }
}
