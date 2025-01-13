import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupSocketServer } from "./socket";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  setupSocketServer(httpServer);
  return httpServer;
}
