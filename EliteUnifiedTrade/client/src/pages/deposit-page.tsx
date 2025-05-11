import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import UserLayout from "@/components/layout/user-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Copy, CheckCircle2, Bitcoin, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TransactionTable from "@/components/dashboard/transaction-table";
import { InvestmentLoader } from "@/components/ui/investment-loader";
import { motion, AnimatePresence } from "framer-motion";

const depositSchema = z.object({
  currency: z.string().min(1, "Please select a cryptocurrency"),
  amount: z.coerce.number().min(50, "Minimum deposit amount is $50"),
});

type DepositFormValues = z.infer<typeof depositSchema>;

// Cryptocurrency icon mappings
const CryptoIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'BTC':
      return <Bitcoin className="h-6 w-6 text-orange-400" />;
    case 'ETH':
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-500"><path d="M12 2L2 12l10 10 10-10z"/></svg>;
    case 'USDT_TRC20':
    case 'USDT_ERC20':
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-500"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M8 10h8"/></svg>;
    default:
      return <Wallet className="h-6 w-6 text-gray-500" />;
  }
};

export default function DepositPage() {
  const { toast } = useToast();
  const [depositCompleted, setDepositCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [depositAnimation, setDepositAnimation] = useState(false);

  // Reset copied status after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Fetch wallet addresses
  const { data: walletAddresses = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/wallets"],
  });

  // Fetch recent deposits
  const { data: deposits = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions/deposits"],
  });

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      currency: "",
      amount: 500,
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormValues) => {
      // Simulate a delay for animation
      setDepositAnimation(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await apiRequest("POST", "/api/transactions/deposit", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setDepositCompleted(true);
      setDepositAnimation(false);
      
      toast({
        title: "Deposit notification sent",
        description: "Your deposit has been recorded. It will be processed shortly.",
      });
    },
    onError: (error: Error) => {
      setDepositAnimation(false);
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepositFormValues) => {
    depositMutation.mutate(data);
  };

  // Get selected currency wallet address
  const selectedCurrency = form.watch("currency");
  const walletAddress = walletAddresses?.[selectedCurrency] || "";
  
  // Handle clipboard copy
  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <UserLayout title="Deposit Funds">
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Make a Deposit
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Send funds to the following wallet address to credit your account.
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

              <AnimatePresence>
                {selectedCurrency && (
                  <motion.div 
                    className="bg-gray-50 p-4 rounded-md border border-gray-200"
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex flex-col items-center">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-xl shadow-md mb-4 w-52 h-52 relative"
                      >
                        <div className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-md">
                          <CryptoIcon type={selectedCurrency} />
                        </div>
                        
                        {/* QR Code simulator with animation */}
                        <div className="w-full h-full flex items-center justify-center bg-white rounded border border-dashed border-gray-300">
                          <div className="relative w-full h-full flex items-center justify-center">
                            {/* QR code pattern simulation */}
                            <div className="grid grid-cols-5 grid-rows-5 gap-1 w-32 h-32">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="bg-gray-800 rounded-sm"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: Math.random() > 0.3 ? 1 : 0.3 }}
                                  transition={{ duration: 0.2, delay: i * 0.02 }}
                                />
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">
                                {selectedCurrency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="w-full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CryptoIcon type={selectedCurrency} />
                          <FormLabel className="text-lg font-medium m-0">Wallet Address</FormLabel>
                        </div>
                        <div className="flex mb-1">
                          <Input
                            type="text"
                            readOnly
                            value={walletAddress || "0x3F4a9c34B1f77DAe82f38d0a903d15e67c14460f"}
                            className="flex-grow rounded-r-none bg-gray-100 font-mono text-sm"
                          />
                          <Button
                            type="button"
                            variant="default"
                            className="rounded-l-none gap-2"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <motion.div
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Copied
                              </motion.div>
                            ) : (
                              <motion.div className="flex items-center gap-1">
                                <Copy className="h-4 w-4" />
                                Copy
                              </motion.div>
                            )}
                          </Button>
                        </div>
                        
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div className="w-8 h-8">
                            <InvestmentLoader type="coin" size="sm" text="" />
                          </div>
                          <p className="text-sm text-blue-700 font-medium">
                            Send <span className="font-bold">{selectedCurrency}</span> to this address to fund your account
                          </p>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span>Amount (USD)</span>
                        <div className="w-4 h-4">
                          <InvestmentLoader type="dollar" size="xs" text="" />
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500.00"
                          {...field}
                          className="text-lg font-medium"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Alert variant="destructive" className="bg-amber-50 border-amber-300 text-amber-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Important: Send only {selectedCurrency || "the selected cryptocurrency"} to this address. Sending any other coin may result in permanent loss.
                  </AlertDescription>
                </Alert>
              </motion.div>

              {depositAnimation ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="w-16 h-16 mb-3">
                    <InvestmentLoader type="coin" size="lg" text="" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Processing Your Deposit</h3>
                  <p className="text-gray-600 text-center">Your transaction is being verified on the blockchain network. This may take a few moments.</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    type="submit" 
                    disabled={!selectedCurrency || depositMutation.isPending}
                    className="w-full py-6 text-lg"
                  >
                    {depositMutation.isPending ? (
                      <>
                        <div className="mr-2">
                          <InvestmentLoader type="dollar" size="sm" text="" />
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <div className="mr-2">
                          <InvestmentLoader type="dollar" size="sm" text="" />  
                        </div>
                        I've Made My Deposit
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </form>
          </Form>
        </div>
      </div>

      <motion.div 
        className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8">
              <InvestmentLoader type="chart" size="sm" text="" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Crypto Deposits
            </h3>
          </div>
          
          <div className="text-sm text-gray-500">
            {deposits.length} transaction{deposits.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <AnimatePresence>
          <motion.div 
            className="border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <TransactionTable 
              transactions={deposits.filter((t: any) => t.type === "deposit")} 
            />
            
            {deposits.length === 0 && (
              <motion.div 
                className="p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="mx-auto w-16 h-16 mb-4">
                  <InvestmentLoader type="coin" size="md" text="" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No deposits yet</h3>
                <p className="text-gray-500">Your deposit history will appear here once you make your first deposit.</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {depositCompleted && (
        <motion.div 
          className="mt-6 p-6 bg-green-50 border border-green-100 rounded-lg"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0">
              <InvestmentLoader type="chart" size="md" text="" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-800 mb-2">Deposit Successfully Recorded</h3>
              <p className="text-green-700">
                Thank you for your deposit. Your transaction has been recorded and will be reflected in your balance shortly.
              </p>
              <div className="mt-4">
                <Button 
                  onClick={() => setDepositCompleted(false)} 
                  variant="outline"
                  className="bg-white border-green-200 text-green-600 hover:bg-green-50"
                >
                  Make Another Deposit
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </UserLayout>
  );
}
