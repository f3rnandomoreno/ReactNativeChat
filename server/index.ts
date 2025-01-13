import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[Server] Initializing application...");
    const server = registerRoutes(app);

    // Middleware de manejo de errores
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[Server] Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // Configuración de Vite en desarrollo
    if (app.get("env") === "development") {
      console.log("[Server] Setting up Vite in development mode");
      await setupVite(app, server);
    } else {
      console.log("[Server] Setting up static serving in production mode");
      serveStatic(app);
    }

    // Iniciar el servidor
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Application successfully started on port ${PORT}`);
      log(`serving on port ${PORT}`);
    });

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('[Server] Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error("[Server] Fatal error during initialization:", error);
    process.exit(1);
  }
})();