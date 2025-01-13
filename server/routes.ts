import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupSocketServer } from "./socket";

export function registerRoutes(app: Express): Server {
  // put application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);

  console.log("[Server] Setting up HTTP server");

  // Configurar el servidor de sockets
  try {
    console.log("[Server] Setting up Socket.IO server");
    setupSocketServer(httpServer);
    console.log("[Server] Socket.IO server setup complete");
  } catch (error) {
    console.error("[Server] Error setting up Socket.IO server:", error);
    throw error;
  }

  return httpServer;
}