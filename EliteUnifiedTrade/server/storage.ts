import { db } from "@db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { pool } from "@db";

// Helper for password hashing
const scryptAsync = promisify(scrypt);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<schema.User>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: Partial<schema.InsertUser>): Promise<schema.User>;
  updateUser(id: number, data: Partial<schema.User>): Promise<schema.User>;
  updateUserPassword(id: number, password: string): Promise<schema.User>;
  updateUserBalance(id: number, amount: number): Promise<schema.User>;
  deleteUser(id: number): Promise<void>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  
  // Investment plan methods
  createInvestmentPlan(plan: Partial<schema.InsertInvestmentPlan>): Promise<schema.InvestmentPlan>;
  updateInvestmentPlan(id: number, data: Partial<schema.InvestmentPlan>): Promise<schema.InvestmentPlan>;
  deleteInvestmentPlan(id: number): Promise<void>;
  
  // Investment methods
  createInvestment(investment: Partial<schema.InsertInvestment>): Promise<schema.Investment>;
  
  // Transaction methods
  createTransaction(transaction: Partial<schema.InsertTransaction>): Promise<schema.Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<schema.Transaction>;
  
  // Wallet settings methods
  getWalletSettings(): Promise<schema.WalletSettings>;
  updateWalletSettings(data: Partial<schema.InsertWalletSettings>): Promise<schema.WalletSettings>;
}

class DatabaseStorage implements IStorage {
  constructor() {
    // No special initialization needed
  }

  async getUser(id: number): Promise<schema.User> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    return await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async createUser(userData: Partial<schema.InsertUser>): Promise<schema.User> {
    // We need to prepare the data properly for the insert
    const insertData = {
      email: userData.email || "", 
      password: userData.password || "",
      fullName: userData.fullName || null,
      phone: userData.phone || null,
      role: userData.role || "user", 
    };
    
    const [user] = await db.insert(schema.users).values(insertData).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<schema.User>): Promise<schema.User> {
    const [updatedUser] = await db.update(schema.users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateUserPassword(id: number, password: string): Promise<schema.User> {
    const hashedPassword = await this.hashPassword(password);
    
    const [updatedUser] = await db.update(schema.users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateUserBalance(id: number, amount: number): Promise<schema.User> {
    const user = await this.getUser(id);
    const newBalance = Number(user.balance) + amount;
    
    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }
    
    const [updatedUser] = await db.update(schema.users)
      .set({
        balance: newBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [hashed, salt] = hashedPassword.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      return false;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  async createInvestmentPlan(planData: Partial<schema.InsertInvestmentPlan>): Promise<schema.InvestmentPlan> {
    // Ensure all required fields are present
    if (!planData.name || !planData.description || !planData.minAmount || !planData.maxAmount || !planData.dailyProfit) {
      throw new Error("Investment plan requires name, description, minAmount, maxAmount, and dailyProfit");
    }
    
    // Create and validate the insert data
    const insertData = schema.insertInvestmentPlanSchema.parse({
      name: planData.name,
      description: planData.description,
      minAmount: planData.minAmount,
      maxAmount: planData.maxAmount,
      dailyProfit: planData.dailyProfit,
      status: planData.status || "active",
      isPopular: planData.isPopular || false,
      features: planData.features || []
    });
    
    const [plan] = await db.insert(schema.investmentPlans).values(insertData).returning();
    return plan;
  }

  async updateInvestmentPlan(id: number, data: Partial<schema.InvestmentPlan>): Promise<schema.InvestmentPlan> {
    const [updatedPlan] = await db.update(schema.investmentPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.investmentPlans.id, id))
      .returning();
    
    return updatedPlan;
  }

  async deleteInvestmentPlan(id: number): Promise<void> {
    await db.delete(schema.investmentPlans).where(eq(schema.investmentPlans.id, id));
  }

  async createInvestment(investmentData: Partial<schema.InsertInvestment>): Promise<schema.Investment> {
    // Ensure required fields are present
    if (!investmentData.userId || !investmentData.planId || !investmentData.amount) {
      throw new Error("Investment requires userId, planId, and amount");
    }
    
    // Create and validate the insert data
    const insertData = schema.insertInvestmentSchema.parse({
      userId: investmentData.userId,
      planId: investmentData.planId,
      amount: investmentData.amount,
      startDate: investmentData.startDate || new Date(),
      isActive: investmentData.isActive !== undefined ? investmentData.isActive : true
    });
    
    const [investment] = await db.insert(schema.investments).values(insertData).returning();
    return investment;
  }

  async createTransaction(transactionData: Partial<schema.InsertTransaction>): Promise<schema.Transaction> {
    // Ensure required fields have values
    if (!transactionData.type || !transactionData.amount || !transactionData.userId) {
      throw new Error("Transaction requires type, amount, and userId");
    }
    
    // Create and validate the insert data
    const insertData = schema.insertTransactionSchema.parse({
      type: transactionData.type,
      amount: transactionData.amount,
      userId: transactionData.userId,
      status: transactionData.status || "pending",
      currency: transactionData.currency || "USD",
      walletAddress: transactionData.walletAddress || null,
      reason: transactionData.reason || null,
    });
    
    const [transaction] = await db.insert(schema.transactions).values(insertData).returning();
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<schema.Transaction> {
    // Ensure status is a valid enum value
    if (!schema.transactionStatusEnum.enumValues.includes(status as any)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    const [updatedTransaction] = await db.update(schema.transactions)
      .set({
        status: status as any, // Cast to enum type
        updatedAt: new Date(),
      })
      .where(eq(schema.transactions.id, id))
      .returning();
    
    return updatedTransaction;
  }

  async getWalletSettings(): Promise<schema.WalletSettings> {
    // Get the first wallet settings record or create one if none exists
    const walletSettings = await db.query.walletSettings.findFirst();
    
    if (walletSettings) {
      return walletSettings;
    }
    
    // Create default wallet settings
    const [newWalletSettings] = await db.insert(schema.walletSettings).values({}).returning();
    return newWalletSettings;
  }

  async updateWalletSettings(data: Partial<schema.InsertWalletSettings>): Promise<schema.WalletSettings> {
    // Check if wallet settings already exist
    const existingSettings = await db.query.walletSettings.findFirst();
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(schema.walletSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.walletSettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(schema.walletSettings).values({
        ...data,
      }).returning();
      
      return newSettings;
    }
  }
}

export const storage = new DatabaseStorage();
