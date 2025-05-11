import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  Wallet, 
  DollarSign, 
  LogOut,
  ChevronDown,
  MessagesSquare
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { href: "/admin/users", label: "Manage Users", icon: <Users className="mr-3 h-5 w-5" /> },
    { href: "/admin/plans", label: "Investment Plans", icon: <LineChart className="mr-3 h-5 w-5" /> },
    { href: "/admin/wallets", label: "Wallet Settings", icon: <Wallet className="mr-3 h-5 w-5" /> },
    { href: "/admin/withdrawals", label: "Withdrawal Requests", icon: <DollarSign className="mr-3 h-5 w-5" /> },
    { href: "/admin/support", label: "Support Chat", icon: <MessagesSquare className="mr-3 h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Dashboard Header */}
      <header className="bg-gray-800 shadow fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin">
              <h1 className="text-2xl font-bold text-white cursor-pointer">
                <span className="text-primary-400">Elite</span>
                <span className="text-secondary-400">Unified</span>Trade
                <span className="ml-2 text-sm bg-red-500 text-white px-2 py-0.5 rounded">Admin</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">
                    <span className="mr-2">{user?.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen overflow-hidden bg-gray-100 pt-16">
        {/* Admin Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 bg-gray-800">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={`${
                        location === item.href 
                          ? "bg-gray-900 text-white" 
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Main admin content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile admin navigation */}
      {isMobile && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-gray-800 border-t border-gray-700">
          <div className="grid grid-cols-6 h-16">
            <Link href="/admin">
              <a className={`flex flex-col items-center justify-center ${location === "/admin" ? "text-white" : "text-gray-400"}`}>
                <LayoutDashboard className="text-lg" />
                <span className="text-xs mt-1">Dashboard</span>
              </a>
            </Link>
            <Link href="/admin/users">
              <a className={`flex flex-col items-center justify-center ${location === "/admin/users" ? "text-white" : "text-gray-400"}`}>
                <Users className="text-lg" />
                <span className="text-xs mt-1">Users</span>
              </a>
            </Link>
            <Link href="/admin/wallets">
              <a className={`flex flex-col items-center justify-center ${location === "/admin/wallets" ? "text-white" : "text-gray-400"}`}>
                <Wallet className="text-lg" />
                <span className="text-xs mt-1">Wallet</span>
              </a>
            </Link>
            <Link href="/admin/withdrawals">
              <a className={`flex flex-col items-center justify-center ${location === "/admin/withdrawals" ? "text-white" : "text-gray-400"}`}>
                <DollarSign className="text-lg" />
                <span className="text-xs mt-1">Withdrawals</span>
              </a>
            </Link>
            <Link href="/admin/plans">
              <a className={`flex flex-col items-center justify-center ${location === "/admin/plans" ? "text-white" : "text-gray-400"}`}>
                <LineChart className="text-lg" />
                <span className="text-xs mt-1">Plans</span>
              </a>
            </Link>
            <Link href="/admin/support">
              <a className={`flex flex-col items-center justify-center ${location === "/admin/support" ? "text-white" : "text-gray-400"}`}>
                <MessagesSquare className="text-lg" />
                <span className="text-xs mt-1">Support</span>
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
