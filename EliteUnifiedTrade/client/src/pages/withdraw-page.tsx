import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import UserLayout from "@/components/layout/user-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info as InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TransactionTable from "@/components/dashboard/transaction-table";
import { useAuth } from "@/hooks/use-auth";
import { InvestmentLoader } from "@/components/ui/investment-loader";

const withdrawSchema = z.object({
  currency: z.string().min(1, "Please select a cryptocurrency"),
  walletAddress: z.string().min(10, "Please enter a valid wallet address"),
  amount: z.coerce.number()
    .min(50, "Minimum withdrawal amount is $50")
    .refine(val => val > 0, "Amount must be greater than 0"),
  reason: z.string().optional(),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

export default function WithdrawPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const availableBalance = typeof user?.balance === 'string' ? parseFloat(user?.balance) : (user?.balance || 0);

  // Fetch recent withdrawals
  const { data: withdrawals = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions/withdrawals"],
  });

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      currency: "",
      walletAddress: "",
      amount: 100,
      reason: "",
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawFormValues) => {
      if (data.amount > availableBalance) {
        throw new Error("Withdrawal amount exceeds available balance");
      }
      
      const res = await apiRequest("POST", "/api/transactions/withdraw", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      form.reset();
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been submitted and is pending approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawFormValues) => {
    withdrawMutation.mutate(data);
  };

  return (
    <UserLayout title="Withdraw Funds">
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Request Withdrawal
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Fill out the form below to withdraw funds from your account.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Cryptocurrency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cryptocurrency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
                        <SelectItem value="USDT_ERC20">USDT (ERC20)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your wallet address" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="mt-2 text-sm text-gray-500">
                      Double-check your wallet address to avoid loss of funds.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100.00" 
                        {...field}
                      />
                    </FormControl>
                    <p className="mt-2 text-sm text-gray-500">
                      Available balance: ${availableBalance.toFixed(2)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Reason for withdrawal" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InfoIcon className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Withdrawal Information</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Minimum withdrawal amount is $50</li>
                        <li>Withdrawals are processed within 24 hours</li>
                        <li>A network fee may apply depending on the cryptocurrency</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={withdrawMutation.isPending || form.formState.isSubmitting}
              >
                {withdrawMutation.isPending ? (
                  <>
                    <div className="mr-2">
                      <InvestmentLoader type="coin" size="sm" text="" />
                    </div>
                    Processing request...
                  </>
                ) : (
                  "Request Withdrawal"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Withdrawals
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <TransactionTable 
            transactions={withdrawals.filter((t: any) => t.type === "withdrawal")} 
          />
        </div>
      </div>
    </UserLayout>
  );
}
