import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateToken, comparePasswords, hashPassword, type AuthenticatedRequest } from "./auth";
import { insertIssueSchema, updateIssueSchema, loginSchema, registerSchema } from "@shared/schema";
import { googleSheetsService } from "./services/googleSheets";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google Sheets
  await googleSheetsService.initializeSheet();
  
  // Initialize test user
  await initializeTestUser();

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !comparePasswords(password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(user.id, user.email, user.role);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
      });

      const token = generateToken(user.id, user.email, user.role);
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
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
  app.post('/api/issues', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
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

  app.put('/api/issues/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
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

  app.delete('/api/issues/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
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

// Initialize test user
async function initializeTestUser() {
  try {
    const testEmail = "admin@test.com";
    const existingUser = await storage.getUserByEmail(testEmail);
    
    if (!existingUser) {
      await storage.createUser({
        email: testEmail,
        password: "password123", // Plain text as requested
        firstName: "Test",
        lastName: "Admin",
        role: "admin",
      });
      console.log("Test user created: admin@test.com / password123");
    }
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}
