import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@db";
import * as schema from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User routes
  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user profile" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { email, fullName, phone } = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, {
        email,
        fullName,
        phone,
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user profile" });
    }
  });

  app.patch("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user!.id);
      
      // Verify current password
      const isPasswordValid = await storage.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const updatedUser = await storage.updateUserPassword(req.user!.id, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error updating password" });
    }
  });

  // Investment plans routes
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await db.query.investmentPlans.findMany({
        where: eq(schema.investmentPlans.status, "active"),
        orderBy: [
          schema.investmentPlans.minAmount
        ],
      });
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Error fetching investment plans" });
    }
  });

  // Investments routes
  app.post("/api/investments", isAuthenticated, async (req, res) => {
    try {
      const { planId, amount } = req.body;
      const userId = req.user!.id;
      
      // Fetch the plan to validate
      const plan = await db.query.investmentPlans.findFirst({
        where: eq(schema.investmentPlans.id, planId),
      });
      
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }
      
      // Validate amount is within plan range
      if (amount < Number(plan.minAmount) || amount > Number(plan.maxAmount)) {
        return res.status(400).json({ message: `Amount must be between $${plan.minAmount} and $${plan.maxAmount}` });
      }
      
      // Check if user has enough balance
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      
      if (!user || Number(user.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create investment
      const investment = await storage.createInvestment({
        userId,
        planId,
        amount,
      });
      
      // Reduce user balance
      await storage.updateUserBalance(userId, -amount);
      
      res.status(201).json(investment);
    } catch (error) {
      res.status(500).json({ message: "Error creating investment" });
    }
  });

  app.get("/api/investments", isAuthenticated, async (req, res) => {
    try {
      const investments = await db.query.investments.findMany({
        where: eq(schema.investments.userId, req.user!.id),
        with: {
          plan: true,
        },
        orderBy: [
          desc(schema.investments.createdAt)
        ],
      });
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching investments" });
    }
  });

  // Transactions routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await db.query.transactions.findMany({
        where: eq(schema.transactions.userId, req.user!.id),
        orderBy: [
          desc(schema.transactions.createdAt)
        ],
      });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/recent", isAuthenticated, async (req, res) => {
    try {
      const transactions = await db.query.transactions.findMany({
        where: eq(schema.transactions.userId, req.user!.id),
        orderBy: [
          desc(schema.transactions.createdAt)
        ],
        limit: 5,
      });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent transactions" });
    }
  });

  app.get("/api/transactions/deposits", isAuthenticated, async (req, res) => {
    try {
      const deposits = await db.query.transactions.findMany({
        where: and(
          eq(schema.transactions.userId, req.user!.id),
          eq(schema.transactions.type, "deposit")
        ),
        orderBy: [
          desc(schema.transactions.createdAt)
        ],
      });
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ message: "Error fetching deposits" });
    }
  });

  app.get("/api/transactions/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const withdrawals = await db.query.transactions.findMany({
        where: and(
          eq(schema.transactions.userId, req.user!.id),
          eq(schema.transactions.type, "withdrawal")
        ),
        orderBy: [
          desc(schema.transactions.createdAt)
        ],
      });
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching withdrawals" });
    }
  });

  app.post("/api/transactions/deposit", isAuthenticated, async (req, res) => {
    try {
      const { amount, currency } = req.body;
      
      if (amount < 50) {
        return res.status(400).json({ message: "Minimum deposit amount is $50" });
      }
      
      // Create deposit transaction
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        type: "deposit",
        amount,
        currency,
        status: "completed", // For demo purposes, deposits are auto-completed
      });
      
      // Update user balance
      await storage.updateUserBalance(req.user!.id, amount);
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error processing deposit" });
    }
  });

  app.post("/api/transactions/withdraw", isAuthenticated, async (req, res) => {
    try {
      const { amount, currency, walletAddress, reason } = req.body;
      
      if (amount < 50) {
        return res.status(400).json({ message: "Minimum withdrawal amount is $50" });
      }
      
      // Check if user has enough balance
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, req.user!.id),
      });
      
      if (!user || Number(user.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create withdrawal transaction (pending by default)
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        type: "withdrawal",
        amount,
        currency,
        walletAddress,
        reason,
        status: "pending",
      });
      
      // Reduce user balance
      await storage.updateUserBalance(req.user!.id, -amount);
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error processing withdrawal" });
    }
  });

  // Wallet settings routes
  app.get("/api/wallets", async (req, res) => {
    try {
      const wallets = await storage.getWalletSettings();
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wallet addresses" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const totalUsersResult = await db.select({
        count: sql<number>`count(*)`,
      }).from(schema.users);
      
      const totalInvestmentsResult = await db.select({
        sum: sql<string>`sum(amount)`,
      }).from(schema.investments);
      
      const pendingWithdrawalsResult = await db.select({
        count: sql<number>`count(*)`,
      }).from(schema.transactions)
        .where(and(
          eq(schema.transactions.type, "withdrawal"),
          eq(schema.transactions.status, "pending")
        ));
      
      const totalProfitResult = await db.select({
        sum: sql<string>`sum(amount)`,
      }).from(schema.transactions)
        .where(eq(schema.transactions.type, "profit"));
      
      const stats = {
        totalUsers: totalUsersResult[0].count || 0,
        totalInvestments: Number(totalInvestmentsResult[0].sum) || 0,
        pendingWithdrawals: pendingWithdrawalsResult[0].count || 0,
        totalProfit: Number(totalProfitResult[0].sum) || 0,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching admin statistics" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await db.query.users.findMany({
        orderBy: [
          desc(schema.users.createdAt)
        ],
      });
      
      // Calculate total investment for each user
      const usersWithInvestments = await Promise.all(
        users.map(async (user) => {
          const investments = await db.query.investments.findMany({
            where: eq(schema.investments.userId, user.id),
            with: {
              plan: true,
            },
          });
          
          const totalInvestment = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
          const planName = investments.length > 0 ? investments[0].plan.name : null;
          
          return {
            ...user,
            totalInvestment,
            planName,
          };
        })
      );
      
      res.json(usersWithInvestments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/admin/users/recent", isAdmin, async (req, res) => {
    try {
      const users = await db.query.users.findMany({
        orderBy: [
          desc(schema.users.createdAt)
        ],
        limit: 5,
      });
      
      // Calculate total investment for each user
      const usersWithInvestments = await Promise.all(
        users.map(async (user) => {
          const investments = await db.query.investments.findMany({
            where: eq(schema.investments.userId, user.id),
            with: {
              plan: true,
            },
          });
          
          const totalInvestment = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
          const planName = investments.length > 0 ? investments[0].plan.name : null;
          
          return {
            ...user,
            totalInvestment,
            planName,
          };
        })
      );
      
      res.json(usersWithInvestments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent users" });
    }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser({
        email,
        password: await storage.hashPassword(password),
        fullName,
        role,
      });
      
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { email, password, fullName, role } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        email,
        fullName,
        role,
      });
      
      // Update password if provided
      if (password) {
        await storage.updateUserPassword(userId, password);
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  app.post("/api/plans", isAdmin, async (req, res) => {
    try {
      const { name, description, minAmount, maxAmount, dailyProfit, isPopular, features } = req.body;
      
      const plan = await storage.createInvestmentPlan({
        name,
        description,
        minAmount,
        maxAmount,
        dailyProfit,
        isPopular,
        features,
      });
      
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ message: "Error creating investment plan" });
    }
  });

  app.patch("/api/plans/:id", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const { name, description, minAmount, maxAmount, dailyProfit, isPopular, features } = req.body;
      
      const plan = await db.query.investmentPlans.findFirst({
        where: eq(schema.investmentPlans.id, planId),
      });
      
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }
      
      const updatedPlan = await storage.updateInvestmentPlan(planId, {
        name,
        description,
        minAmount,
        maxAmount,
        dailyProfit,
        isPopular,
        features,
      });
      
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Error updating investment plan" });
    }
  });

  app.delete("/api/plans/:id", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      const plan = await db.query.investmentPlans.findFirst({
        where: eq(schema.investmentPlans.id, planId),
      });
      
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }
      
      await storage.deleteInvestmentPlan(planId);
      
      res.json({ message: "Investment plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting investment plan" });
    }
  });

  app.patch("/api/wallets", isAdmin, async (req, res) => {
    try {
      const { BTC, ETH, USDT_TRC20, USDT_ERC20 } = req.body;
      
      const walletSettings = await storage.updateWalletSettings({
        BTC,
        ETH,
        USDT_TRC20,
        USDT_ERC20,
      });
      
      res.json(walletSettings);
    } catch (error) {
      res.status(500).json({ message: "Error updating wallet settings" });
    }
  });

  app.get("/api/admin/withdrawals", isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      
      let withdrawals;
      if (status && status !== "all") {
        withdrawals = await db.query.transactions.findMany({
          where: and(
            eq(schema.transactions.type, "withdrawal"),
            eq(schema.transactions.status, status as string)
          ),
          orderBy: [
            desc(schema.transactions.createdAt)
          ],
          with: {
            user: true,
          },
        });
      } else {
        withdrawals = await db.query.transactions.findMany({
          where: eq(schema.transactions.type, "withdrawal"),
          orderBy: [
            desc(schema.transactions.createdAt)
          ],
          with: {
            user: true,
          },
        });
      }
      
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching withdrawal requests" });
    }
  });

  app.get("/api/admin/withdrawals/pending", isAdmin, async (req, res) => {
    try {
      const pendingWithdrawals = await db.query.transactions.findMany({
        where: and(
          eq(schema.transactions.type, "withdrawal"),
          eq(schema.transactions.status, "pending")
        ),
        orderBy: [
          desc(schema.transactions.createdAt)
        ],
        with: {
          user: true,
        },
      });
      
      res.json(pendingWithdrawals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending withdrawal requests" });
    }
  });

  app.patch("/api/admin/withdrawals/:id/approve", isAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      
      const withdrawal = await db.query.transactions.findFirst({
        where: and(
          eq(schema.transactions.id, withdrawalId),
          eq(schema.transactions.type, "withdrawal"),
          eq(schema.transactions.status, "pending")
        ),
      });
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Pending withdrawal request not found" });
      }
      
      const updatedWithdrawal = await storage.updateTransactionStatus(withdrawalId, "completed");
      
      res.json(updatedWithdrawal);
    } catch (error) {
      res.status(500).json({ message: "Error approving withdrawal request" });
    }
  });

  app.patch("/api/admin/withdrawals/:id/reject", isAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      
      const withdrawal = await db.query.transactions.findFirst({
        where: and(
          eq(schema.transactions.id, withdrawalId),
          eq(schema.transactions.type, "withdrawal"),
          eq(schema.transactions.status, "pending")
        ),
      });
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Pending withdrawal request not found" });
      }
      
      // Restore user balance
      await storage.updateUserBalance(withdrawal.userId, Number(withdrawal.amount));
      
      // Update transaction status
      const updatedWithdrawal = await storage.updateTransactionStatus(withdrawalId, "rejected");
      
      res.json(updatedWithdrawal);
    } catch (error) {
      res.status(500).json({ message: "Error rejecting withdrawal request" });
    }
  });

  // Chat message routes
  app.post("/api/chat/messages", isAuthenticated, async (req, res) => {
    try {
      const { content } = req.body;
      const userId = req.user!.id;
      
      const message = await db.insert(schema.chatMessages).values({
        userId,
        content,
        status: "unread",
      }).returning();
      
      res.status(201).json(message[0]);
    } catch (error) {
      res.status(500).json({ message: "Error sending message" });
    }
  });

  app.get("/api/chat/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const messages = await db.query.chatMessages.findMany({
        where: eq(schema.chatMessages.userId, userId),
        orderBy: [desc(schema.chatMessages.createdAt)],
      });
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // Admin chat routes
  app.get("/api/admin/chat/messages", isAdmin, async (req, res) => {
    try {
      const messages = await db.query.chatMessages.findMany({
        with: {
          user: true,
        },
        orderBy: [desc(schema.chatMessages.createdAt)],
      });
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  app.get("/api/admin/chat/messages/unread", isAdmin, async (req, res) => {
    try {
      const messages = await db.query.chatMessages.findMany({
        where: eq(schema.chatMessages.status, "unread"),
        with: {
          user: true,
        },
        orderBy: [desc(schema.chatMessages.createdAt)],
      });
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching unread messages" });
    }
  });

  app.patch("/api/admin/chat/messages/:id", isAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { adminResponse, status } = req.body;
      
      const message = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, messageId),
      });
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      const updatedMessage = await db
        .update(schema.chatMessages)
        .set({
          adminResponse,
          adminId: req.user!.id,
          status: status || "replied",
          updatedAt: new Date(),
        })
        .where(eq(schema.chatMessages.id, messageId))
        .returning();
      
      res.json(updatedMessage[0]);
    } catch (error) {
      res.status(500).json({ message: "Error updating message" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map();
  
  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('?userId=')[1];
    
    if (userId) {
      clients.set(userId, ws);
      
      ws.on('message', async (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          
          if (parsedMessage.type === 'chat') {
            // Store message in database
            const chatMessage = await db.insert(schema.chatMessages).values({
              userId: parseInt(userId),
              content: parsedMessage.content,
              status: "unread",
            }).returning();
            
            // Broadcast to all admins
            clients.forEach((client, clientId) => {
              const user = db.query.users.findFirst({
                where: eq(schema.users.id, parseInt(clientId)),
              });
              
              if (user && user.role === 'admin' && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  message: chatMessage[0],
                }));
              }
            });
          } else if (parsedMessage.type === 'admin_reply' && parsedMessage.messageId) {
            // Admin reply - update message in database
            const updatedMessage = await db
              .update(schema.chatMessages)
              .set({
                adminResponse: parsedMessage.content,
                adminId: parseInt(userId),
                status: "replied",
                updatedAt: new Date(),
              })
              .where(eq(schema.chatMessages.id, parsedMessage.messageId))
              .returning();
            
            // Send to the original user
            const targetUserId = updatedMessage[0].userId.toString();
            const targetWs = clients.get(targetUserId);
            
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: 'admin_reply',
                message: updatedMessage[0],
              }));
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        clients.delete(userId);
      });
    }
  });

  return httpServer;
}
