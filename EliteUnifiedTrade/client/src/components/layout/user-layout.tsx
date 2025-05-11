import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Clock, 
  User, 
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

interface UserLayoutProps {
  children: ReactNode;
  title: string;
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home className="mr-3 h-5 w-5" /> },
    { href: "/investments", label: "Investments", icon: <TrendingUp className="mr-3 h-5 w-5" /> },
    { href: "/deposit", label: "Deposit", icon: <Wallet className="mr-3 h-5 w-5" /> },
    { href: "/withdraw", label: "Withdraw", icon: <DollarSign className="mr-3 h-5 w-5" /> },
    { href: "/transactions", label: "Transactions", icon: <Clock className="mr-3 h-5 w-5" /> },
    { href: "/support", label: "Support Chat", icon: <MessagesSquare className="mr-3 h-5 w-5" /> },
    { href: "/profile", label: "Profile", icon: <User className="mr-3 h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white shadow fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">
                <span className="text-primary-600">Elite</span>
                <span className="text-secondary-500">Unified</span>Trade
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
              <span className="font-medium">Balance:</span>
              <span className="text-green-600 font-semibold">${user?.balance?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <span className="mr-2">{user?.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
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
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 bg-white shadow">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={`${
                        location === item.href 
                          ? "bg-primary-50 text-primary-700" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
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

      {/* Mobile navigation */}
      {isMobile && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200">
          <div className="grid grid-cols-6 h-16">
            <Link href="/">
              <a className={`flex flex-col items-center justify-center ${location === "/" ? "text-primary-600" : "text-gray-500"}`}>
                <Home className="text-lg" />
                <span className="text-xs mt-1">Home</span>
              </a>
            </Link>
            <Link href="/investments">
              <a className={`flex flex-col items-center justify-center ${location === "/investments" ? "text-primary-600" : "text-gray-500"}`}>
                <TrendingUp className="text-lg" />
                <span className="text-xs mt-1">Invest</span>
              </a>
            </Link>
            <Link href="/deposit">
              <a className={`flex flex-col items-center justify-center ${location === "/deposit" ? "text-primary-600" : "text-gray-500"}`}>
                <Wallet className="text-lg" />
                <span className="text-xs mt-1">Deposit</span>
              </a>
            </Link>
            <Link href="/withdraw">
              <a className={`flex flex-col items-center justify-center ${location === "/withdraw" ? "text-primary-600" : "text-gray-500"}`}>
                <DollarSign className="text-lg" />
                <span className="text-xs mt-1">Withdraw</span>
              </a>
            </Link>
            <Link href="/support">
              <a className={`flex flex-col items-center justify-center ${location === "/support" ? "text-primary-600" : "text-gray-500"}`}>
                <MessagesSquare className="text-lg" />
                <span className="text-xs mt-1">Support</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`flex flex-col items-center justify-center ${location === "/profile" ? "text-primary-600" : "text-gray-500"}`}>
                <User className="text-lg" />
                <span className="text-xs mt-1">Profile</span>
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
