import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const walletSchema = z.object({
  BTC: z.string().min(10, "Bitcoin wallet address must be at least 10 characters"),
  ETH: z.string().min(10, "Ethereum wallet address must be at least 10 characters"),
  USDT_TRC20: z.string().min(10, "USDT TRC20 wallet address must be at least 10 characters"),
  USDT_ERC20: z.string().min(10, "USDT ERC20 wallet address must be at least 10 characters"),
});

type WalletFormValues = z.infer<typeof walletSchema>;

export default function WalletsPage() {
  const { toast } = useToast();

  // Fetch wallet addresses
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["/api/wallets"],
  });

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      BTC: "",
      ETH: "",
      USDT_TRC20: "",
      USDT_ERC20: "",
    },
  });

  // Set form values when wallets are loaded
  React.useEffect(() => {
    if (wallets) {
      form.reset({
        BTC: wallets.BTC || "",
        ETH: wallets.ETH || "",
        USDT_TRC20: wallets.USDT_TRC20 || "",
        USDT_ERC20: wallets.USDT_ERC20 || "",
      });
    }
  }, [wallets, form]);

  // Update wallets mutation
  const updateWalletsMutation = useMutation({
    mutationFn: async (data: WalletFormValues) => {
      const res = await apiRequest("PATCH", "/api/wallets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Wallet settings updated",
        description: "The wallet addresses have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating wallet settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WalletFormValues) => {
    updateWalletsMutation.mutate(data);
  };

  return (
    <AdminLayout title="Wallet Settings">
      <Card>
        <CardHeader>
          <CardTitle>Platform Wallet Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="BTC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitcoin (BTC) Wallet Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ETH"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ethereum (ETH) Wallet Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 0x1A2f3B4C5d6E7f8g9H0i1J2k3L4m5N6o7P8q9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="USDT_TRC20"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>USDT (TRC20) Wallet Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. TXxyz1234567890abcdef1234567890abcdef12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="USDT_ERC20"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>USDT (ERC20) Wallet Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 0xabcdef1234567890ABCDEF1234567890abcdef12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={updateWalletsMutation.isPending || !form.formState.isDirty}
                >
                  {updateWalletsMutation.isPending ? (
                    <span className="mr-2 animate-spin">●</span>
                  ) : null}
                  Update Wallet Addresses
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
