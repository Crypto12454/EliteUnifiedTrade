import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layout/user-layout";
import StatsCard from "@/components/dashboard/stats-card";
import InvestmentPlanCard from "@/components/dashboard/investment-plan-card";
import TransactionTable from "@/components/dashboard/transaction-table";
import { Wallet, TrendingUp, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { InvestmentLoader } from "@/components/ui/investment-loader";

// Define types for clarity and type safety
interface InvestmentPlan {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  dailyProfit: number;
  description: string;
  features: { text: string }[];
  status: string;
}

interface Transaction {
  id: number;
  date: string;
  type: "deposit" | "withdrawal" | "profit";
  amount: number;
  status: "completed" | "pending" | "failed";
  currency?: string;
}

interface Investment {
  id: number;
  userId: number;
  planId: number;
  amount: number;
  startDate: string;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch investment plans
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ["/api/plans"],
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  // Calculate summary values
  const totalProfit = transactions
    .filter(t => t.type === "profit")
    .reduce((sum, t) => sum + t.amount, 0);

  // Type assertions are necessary since useAuth's user type may not match with our expected interface
  const investments = (user as any)?.investments || [];
  const activeInvestment = Array.isArray(investments)
    ? investments.reduce((sum, inv: Investment) => sum + inv.amount, 0)
    : 0;
  
  // Convert balance to number as it might be stored as string in DB
  const balance = user?.balance ? parseFloat(user.balance.toString()) : 0;

  return (
    <UserLayout title="Dashboard">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Account Summary Card */}
        <StatsCard
          title="Account Balance"
          value={`$${balance.toFixed(2)}`}
          icon={<Wallet className="h-5 w-5" />}
          linkText="View details"
          linkHref="/transactions"
        />

        {/* Total Profit Card */}
        <StatsCard
          title="Total Profit"
          value={`$${totalProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor="bg-green-500"
          linkText="View details"
          linkHref="/transactions"
        />

        {/* Active Investment Card */}
        <StatsCard
          title="Active Investment"
          value={`$${activeInvestment.toFixed(2)}`}
          icon={<LineChart className="h-5 w-5" />}
          iconBgColor="bg-secondary-500"
          linkText="View details"
          linkHref="/investments"
        />
      </div>

      {/* Investment Plans */}
      <div className="mt-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Investment Plans</h2>
        <div className="mt-5">
          {isLoadingPlans ? (
            <div className="flex justify-center items-center py-12">
              <InvestmentLoader type="trend" size="lg" text="Analyzing investment opportunities..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-3">
              {plans.map((plan) => (
                <InvestmentPlanCard
                  key={plan.id}
                  id={plan.id}
                  name={plan.name}
                  minAmount={plan.minAmount}
                  maxAmount={plan.maxAmount}
                  dailyProfit={plan.dailyProfit}
                  description={plan.description}
                  features={plan.features}
                  isPopular={plan.name === "Platinum Plan"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h2>
        <div className="mt-5">
          {isLoadingTransactions ? (
            <div className="flex justify-center items-center py-12">
              <InvestmentLoader type="chart" size="lg" text="Loading your transaction history..." />
            </div>
          ) : (
            <div className="flex flex-col">
              <TransactionTable transactions={transactions} />
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
