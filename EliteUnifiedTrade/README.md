# Elite Unified Trade - Investment Platform

A modern investment platform designed to simplify and enhance the investment experience through intuitive user interfaces and comprehensive management tools.

![Elite Unified Trade](screenshot.png)

## Features

### User Features
- **Secure Authentication**: JWT-based authentication system with role-based access control
- **Investment Plans**: Browse and invest in various investment plans with different profit rates
- **Portfolio Management**: Track your investments and earnings in real-time
- **Deposit System**: Cryptocurrency-based deposit system with QR code visualization
- **Withdrawal Management**: Request withdrawals with simple form submission
- **Transaction History**: View complete history of deposits, withdrawals, and profits
- **Live Support Chat**: Real-time chat with administrators for support

### Admin Features
- **Admin Dashboard**: Overview of platform statistics and activities
- **User Management**: View and manage user accounts
- **Investment Plan Management**: Create, edit, and manage investment plans
- **Wallet Configuration**: Configure cryptocurrency wallet addresses
- **Withdrawal Request Handling**: Review and process withdrawal requests
- **Support Chat System**: Respond to user inquiries through live chat

## Technology Stack

- **Frontend**: React with TypeScript, Vite
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **UI Component Library**: Shadcn UI components with Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: WebSockets for chat functionality

## Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database

### Setup
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/elite-unified-trade.git
   cd elite-unified-trade
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/elite_unified_trade
   JWT_SECRET=your_secure_jwt_secret
   ```

4. Set up the database:
   ```
   npm run db:push
   npm run db:seed
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5000`

## Deployment

The application is designed to be deployed on Vercel or any other modern hosting platform. The backend and frontend are integrated to allow single-origin deployment.

## Authentication

The system has two default user types:
- Regular User: Manages investments, deposits, and withdrawals
- Admin: Manages the platform, users, and investment plans

Role-based access control ensures that users can only access the appropriate sections of the application.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.