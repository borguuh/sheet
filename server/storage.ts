import {
  users,
  issues,
  type User,
  type UpsertUser,
  type Issue,
  type InsertIssue,
  type UpdateIssue,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ilike, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Issue operations
  getAllIssues(filters?: {
    status?: string;
    type?: string;
    search?: string;
  }): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | undefined>;
  createIssue(issue: InsertIssue, createdBy: string): Promise<Issue>;
  updateIssue(id: string, issue: UpdateIssue, updatedBy: string): Promise<Issue | undefined>;
  deleteIssue(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Issue operations
  async getAllIssues(filters?: {
    status?: string;
    type?: string;
    search?: string;
  }): Promise<Issue[]> {
    let query = db.select().from(issues);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(issues.status, filters.status));
    }
    
    if (filters?.type) {
      conditions.push(eq(issues.type, filters.type));
    }
    
    if (filters?.search) {
      conditions.push(
        ilike(issues.title, `%${filters.search}%`)
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(issues.createdAt)).execute();
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue;
  }

  async createIssue(issue: InsertIssue, createdBy: string): Promise<Issue> {
    const [newIssue] = await db
      .insert(issues)
      .values({
        ...issue,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();
    return newIssue;
  }

  async updateIssue(id: string, issue: UpdateIssue, updatedBy: string): Promise<Issue | undefined> {
    const [updatedIssue] = await db
      .update(issues)
      .set({
        ...issue,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, id))
      .returning();
    return updatedIssue;
  }

  async deleteIssue(id: string): Promise<boolean> {
    const result = await db.delete(issues).where(eq(issues.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
