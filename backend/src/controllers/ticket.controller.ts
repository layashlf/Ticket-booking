import { Request, Response } from "express";
import { getTicketCatalog } from "../services/ticket.service";
import { TicketDTO } from "../types";

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
}
