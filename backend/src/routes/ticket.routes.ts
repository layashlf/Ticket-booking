import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";

export const ticketRouter = Router();

ticketRouter.get("/tickets", TicketController.getTickets);
