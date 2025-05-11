import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seeding...");
    
    // Check if admin user exists
    const adminUser = await db.query.users.findFirst({
      where: (users) => eq(users.email, "admin@eliteunifiedtrade.com"),
    });
    
    if (!adminUser) {
      console.log("Creating admin user...");
      await db.insert(schema.users).values({
        email: "admin@eliteunifiedtrade.com",
        password: await hashPassword("admin123"),
        fullName: "Admin User",
        role: "admin",
        balance: "100000",
      });
    }
    
    // Check if demo user exists
    const demoUser = await db.query.users.findFirst({
      where: (users) => eq(users.email, "user@eliteunifiedtrade.com"),
    });
    
    if (!demoUser) {
      console.log("Creating demo user...");
      await db.insert(schema.users).values({
        email: "user@eliteunifiedtrade.com",
        password: await hashPassword("user123"),
        fullName: "John Smith",
        balance: "3250.75",
      });
    }
    
    // Check if investment plans exist
    const plansCount = await db.query.investmentPlans.findMany();
    
    if (plansCount.length === 0) {
      console.log("Creating investment plans...");
      
      // Starter Plan
      await db.insert(schema.investmentPlans).values({
        name: "Starter Plan",
        description: "Perfect for beginners looking to start their investment journey.",
        minAmount: "500",
        maxAmount: "999",
        dailyProfit: "1",
        isPopular: false,
        features: [
          { text: "1% Daily Profit" },
          { text: "24/7 Support" },
          { text: "Fast Withdrawals" }
        ],
      });
      
      // Platinum Plan
      await db.insert(schema.investmentPlans).values({
        name: "Platinum Plan",
        description: "Our most popular plan, designed for serious investors.",
        minAmount: "1000",
        maxAmount: "9999",
        dailyProfit: "1",
        isPopular: true,
        features: [
          { text: "1% Daily Profit" },
          { text: "24/7 Priority Support" },
          { text: "Daily Profit Reports" },
          { text: "Fast Withdrawals" }
        ],
      });
      
      // Exclusive Plan
      await db.insert(schema.investmentPlans).values({
        name: "Exclusive Plan",
        description: "For high-net-worth investors seeking maximum returns.",
        minAmount: "10000",
        maxAmount: "99999",
        dailyProfit: "1",
        isPopular: false,
        features: [
          { text: "1% Daily Profit" },
          { text: "VIP Support" },
          { text: "Dedicated Account Manager" },
          { text: "Priority Withdrawals" }
        ],
      });
    }
    
    // Check if wallet settings exist
    const walletSettings = await db.query.walletSettings.findFirst();
    
    if (!walletSettings) {
      console.log("Creating wallet settings...");
      await db.insert(schema.walletSettings).values({
        BTC: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5",
        ETH: "0x1A2f3B4C5d6E7f8g9H0i1J2k3L4m5N6o7P8q9",
        USDT_TRC20: "TXxyz1234567890abcdef1234567890abcdef12",
        USDT_ERC20: "0xabcdef1234567890ABCDEF1234567890abcdef12",
      });
    }
    
    // Add demo transactions for the demo user if they don't exist
    const demoUserAfterCreate = await db.query.users.findFirst({
      where: (users) => eq(users.email, "user@eliteunifiedtrade.com"),
    });
    
    if (demoUserAfterCreate) {
      const transactions = await db.query.transactions.findMany({
        where: (txns) => eq(txns.userId, demoUserAfterCreate.id),
      });
      
      if (transactions.length === 0) {
        console.log("Creating demo transactions...");
        
        // Demo deposit
        await db.insert(schema.transactions).values({
          userId: demoUserAfterCreate.id,
          type: "deposit",
          amount: "3000",
          currency: "BTC",
          status: "completed",
          createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        });
        
        // Demo profits
        await db.insert(schema.transactions).values({
          userId: demoUserAfterCreate.id,
          type: "profit",
          amount: "30",
          status: "completed",
          createdAt: new Date(new Date().setDate(new Date().getDate() - 4)),
        });
        
        await db.insert(schema.transactions).values({
          userId: demoUserAfterCreate.id,
          type: "profit",
          amount: "30",
          status: "completed",
          createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
        });
        
        // Demo withdrawal
        await db.insert(schema.transactions).values({
          userId: demoUserAfterCreate.id,
          type: "withdrawal",
          amount: "100",
          currency: "BTC",
          walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          status: "pending",
          createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        });
        
        // Add a demo investment
        await db.insert(schema.investments).values({
          userId: demoUserAfterCreate.id,
          planId: 2, // Platinum Plan
          amount: "3000",
          isActive: true,
          startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        });
      }
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
