import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User } from "@shared/schema";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "elite-unified-trade-jwt-secret";
const JWT_EXPIRES_IN = "7d"; // Token valid for 7 days

// Interface for decoded JWT token
interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate JWT token
function generateToken(user: User) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// JWT authentication middleware
function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      req.user = decoded as Express.User;
      next();
    });
  } else {
    // Check for token in cookies as fallback
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      req.user = decoded as Express.User;
      next();
    });
  }
}

export function setupAuth(app: Express) {
  // Initialize passport
  app.use(passport.initialize());

  // Local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create new user
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        role: "user", // Default role
      });

      // Generate JWT token
      const token = generateToken(user);
      
      // Remove password from response
      const userResponse = { ...user } as any;
      delete userResponse.password;

      // Set token in cookie (for web browsers)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user data and token
      return res.status(201).json({
        user: userResponse,
        token
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(400).json({ message: info?.message || "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken(user);
      
      // Remove password from response
      const userResponse = { ...user } as any;
      delete userResponse.password;

      // Set token in cookie (for web browsers)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user data and token
      return res.status(200).json({
        user: userResponse,
        token
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    // Clear the token cookie
    res.clearCookie('token');
    return res.status(200).json({ message: "Logged out successfully" });
  });

  // Get current user endpoint
  app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    
    if (!authHeader && !cookieToken) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    try {
      const token = authHeader ? authHeader.split(' ')[1] : cookieToken;
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      // Get fresh user data from database
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const userResponse = { ...user } as any;
      delete userResponse.password;
      
      return res.status(200).json(userResponse);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  
  if (!authHeader && !cookieToken) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  try {
    const token = authHeader ? authHeader.split(' ')[1] : cookieToken;
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    req.user = decoded as Express.User;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  
  if (!authHeader && !cookieToken) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  try {
    const token = authHeader ? authHeader.split(' ')[1] : cookieToken;
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    req.user = decoded as Express.User;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
