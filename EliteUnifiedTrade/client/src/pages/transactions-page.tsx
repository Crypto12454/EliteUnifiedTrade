import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layout/user-layout";
import TransactionTable from "@/components/dashboard/transaction-table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestmentLoader } from "@/components/ui/investment-loader";

// Define transaction type interface
interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'profit';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected' | 'failed';
  currency?: string;
  walletAddress?: string;
  userId: number;
}

export default function TransactionsPage() {
  const [transactionType, setTransactionType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");

  // Fetch all transactions
  const { data: allTransactions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions", transactionType, timeRange],
  });

  // Filter transactions based on selected type and time range
  const getFilteredTransactions = () => {
    let filtered = Array.isArray(allTransactions) ? [...allTransactions] : [];
    
    // Filter by transaction type
    if (transactionType !== "all") {
      filtered = filtered.filter((t: any) => t.type === transactionType);
    }
    
    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter((t: any) => new Date(t.date) >= startDate);
    }
    
    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <UserLayout title="Transactions">
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <Select 
                defaultValue="all" 
                onValueChange={(value) => setTransactionType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="profit">Profits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <Select 
                defaultValue="all" 
                onValueChange={(value) => setTimeRange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="table" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              {isLoading ? (
                <div className="py-10 flex flex-col items-center justify-center">
                  <InvestmentLoader type="chart" size="lg" text="Analyzing your transaction history..." />
                </div>
              ) : (
                <TransactionTable transactions={filteredTransactions} />
              )}
            </TabsContent>
            
            <TabsContent value="summary">
              {isLoading ? (
                <div className="py-10 flex flex-col items-center justify-center">
                  <InvestmentLoader type="pie" size="lg" text="Calculating your financial summary..." />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-500">
                        <div className="flex items-center">
                          <div className="w-5 h-5 mr-2">
                            <InvestmentLoader type="dollar" size="sm" text="" />
                          </div>
                          Total Deposits
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">
                        ${filteredTransactions
                          .filter((t: any) => t.type === 'deposit')
                          .reduce((sum: number, t: any) => sum + t.amount, 0)
                          .toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-500">
                        <div className="flex items-center">
                          <div className="w-5 h-5 mr-2">
                            <InvestmentLoader type="coin" size="sm" text="" />
                          </div>
                          Total Withdrawals
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">
                        ${Math.abs(filteredTransactions
                          .filter((t: any) => t.type === 'withdrawal')
                          .reduce((sum: number, t: any) => sum + t.amount, 0))
                          .toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-500">
                        <div className="flex items-center">
                          <div className="w-5 h-5 mr-2">
                            <InvestmentLoader type="trend" size="sm" text="" />
                          </div>
                          Total Profit
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        ${filteredTransactions
                          .filter((t: any) => t.type === 'profit')
                          .reduce((sum: number, t: any) => sum + t.amount, 0)
                          .toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </UserLayout>
  );
}
