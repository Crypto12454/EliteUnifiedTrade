import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import DepositPage from "@/pages/deposit-page";
import WithdrawPage from "@/pages/withdraw-page";
import TransactionsPage from "@/pages/transactions-page";
import ProfilePage from "@/pages/profile-page";
import SupportPage from "@/pages/support-page";
import AdminDashboardPage from "@/pages/admin/dashboard-page";
import AdminUsersPage from "@/pages/admin/users-page";
import AdminPlansPage from "@/pages/admin/plans-page";
import AdminWalletsPage from "@/pages/admin/wallets-page";
import AdminWithdrawalsPage from "@/pages/admin/withdrawals-page";
import AdminChatSupportPage from "@/pages/admin/chat-support-page";

function Router() {
  return (
    <Switch>
      {/* Auth Page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* User Pages */}
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/deposit" component={DepositPage} />
      <ProtectedRoute path="/withdraw" component={WithdrawPage} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/support" component={SupportPage} />
      
      {/* Admin Pages */}
      <ProtectedRoute path="/admin" component={AdminDashboardPage} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <ProtectedRoute path="/admin/plans" component={AdminPlansPage} />
      <ProtectedRoute path="/admin/wallets" component={AdminWalletsPage} />
      <ProtectedRoute path="/admin/withdrawals" component={AdminWithdrawalsPage} />
      <ProtectedRoute path="/admin/support" component={AdminChatSupportPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
