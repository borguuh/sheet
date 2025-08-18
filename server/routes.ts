import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertIssueSchema, updateIssueSchema } from "@shared/schema";
import { googleSheetsService } from "./services/googleSheets";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google Sheets
  await googleSheetsService.initializeSheet();
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public issue routes
  app.get('/api/issues', async (req, res) => {
    try {
      const { status, type, search } = req.query;
      const filters = {
        status: status as string,
        type: type as string,
        search: search as string,
      };
      
      const issues = await storage.getAllIssues(filters);
      
      // Remove sensitive fields from response
      const publicIssues = issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        type: issue.type,
        description: issue.description,
        impact: issue.impact,
        status: issue.status,
        expectedFixDate: issue.expectedFixDate,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      }));
      
      res.json(publicIssues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get('/api/issues/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const issue = await storage.getIssue(id);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Remove sensitive fields from response
      const publicIssue = {
        id: issue.id,
        title: issue.title,
        type: issue.type,
        description: issue.description,
        impact: issue.impact,
        status: issue.status,
        expectedFixDate: issue.expectedFixDate,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      };
      
      res.json(publicIssue);
    } catch (error) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  // Protected issue routes (admin only)
  app.post('/api/issues', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertIssueSchema.parse(req.body);
      
      const issue = await storage.createIssue(validatedData, userId);
      
      // Sync to Google Sheets
      await googleSheetsService.syncIssueToSheets(issue, 'create');
      
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating issue:", error);
      res.status(500).json({ message: "Failed to create issue" });
    }
  });

  app.put('/api/issues/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const validatedData = updateIssueSchema.parse(req.body);
      
      const issue = await storage.updateIssue(id, validatedData, userId);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Sync to Google Sheets
      await googleSheetsService.syncIssueToSheets(issue, 'update');
      
      res.json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating issue:", error);
      res.status(500).json({ message: "Failed to update issue" });
    }
  });

  app.delete('/api/issues/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get the issue before deleting for Google Sheets sync
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      const deleted = await storage.deleteIssue(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Sync to Google Sheets
      await googleSheetsService.syncIssueToSheets(issue, 'delete');
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting issue:", error);
      res.status(500).json({ message: "Failed to delete issue" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
