import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Memory routes
  app.get("/api/memories", async (req, res) => {
    try {
      // In a real application, this would use the database
      // but since we're using Firebase on the client side for this app,
      // the endpoint is just for completeness
      res.json({ message: "This endpoint is not used - memories are fetched directly from Firebase" });
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
