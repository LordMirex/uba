import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to fetch Nigerian banks from BudPay API
  // This proxies the request to keep the API key secure on the server
  app.get("/api/banks", async (req, res) => {
    try {
      const apiKey = process.env.BUDPAY_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          success: false, 
          message: "BudPay API key not configured" 
        });
      }

      const response = await fetch("https://api.budpay.com/api/v2/bank_list/NGN", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`BudPay API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch bank list" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
