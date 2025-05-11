import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum('role', ['user', 'admin']);
export const planStatusEnum = pgEnum('plan_status', ['active', 'inactive']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'profit']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'rejected', 'failed']);
export const messageStatusEnum = pgEnum('message_status', ['unread', 'read', 'replied']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Investment plans table
export const investmentPlans = pgTable("investment_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }).notNull(),
  dailyProfit: decimal("daily_profit", { precision: 5, scale: 2 }).notNull(),
  isPopular: boolean("is_popular").default(false),
  features: json("features").$type<{ text: string }[]>().default([]),
  status: planStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User investments table
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => investmentPlans.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency"),
  walletAddress: text("wallet_address"),
  reason: text("reason"),
  status: transactionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet settings table
export const walletSettings = pgTable("wallet_settings", {
  id: serial("id").primaryKey(),
  BTC: text("btc"),
  ETH: text("eth"),
  USDT_TRC20: text("usdt_trc20"),
  USDT_ERC20: text("usdt_erc20"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").default("unread").notNull(),
  adminResponse: text("admin_response"),
  adminId: integer("admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  investments: many(investments),
  transactions: many(transactions),
  sentMessages: many(chatMessages, { relationName: "sentMessages" }),
  adminResponses: many(chatMessages, { relationName: "adminResponses" }),
}));

export const investmentPlansRelations = relations(investmentPlans, ({ many }) => ({
  investments: many(investments),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, { fields: [investments.userId], references: [users.id] }),
  plan: one(investmentPlans, { fields: [investments.planId], references: [investmentPlans.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id], relationName: "sentMessages" }),
  admin: one(users, { fields: [chatMessages.adminId], references: [users.id], relationName: "adminResponses" }),
}));

// Create schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email address"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  balance: (schema) => schema.optional(),
  role: (schema) => schema.optional(),
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans, {
  name: (schema) => schema.min(3, "Plan name must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  minAmount: (schema) => schema.min(1, "Minimum amount must be greater than 0"),
  maxAmount: (schema) => schema.min(1, "Maximum amount must be greater than 0"),
  dailyProfit: (schema) => schema.min(0.1, "Daily profit must be at least 0.1%"),
});

export const insertInvestmentSchema = createInsertSchema(investments, {
  amount: (schema) => schema.min(1, "Amount must be greater than 0"),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: (schema) => schema.min(1, "Amount must be greater than 0"),
});

export const insertWalletSettingsSchema = createInsertSchema(walletSettings, {
  BTC: (schema) => schema.min(10, "Bitcoin wallet address must be at least 10 characters"),
  ETH: (schema) => schema.min(10, "Ethereum wallet address must be at least 10 characters"),
  USDT_TRC20: (schema) => schema.min(10, "USDT TRC20 wallet address must be at least 10 characters"),
  USDT_ERC20: (schema) => schema.min(10, "USDT ERC20 wallet address must be at least 10 characters"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  content: (schema) => schema.min(1, "Message cannot be empty"),
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertWalletSettings = z.infer<typeof insertWalletSettingsSchema>;
export type WalletSettings = typeof walletSettings.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
