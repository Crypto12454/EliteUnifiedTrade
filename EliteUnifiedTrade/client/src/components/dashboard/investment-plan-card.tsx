import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InvestmentLoader } from "@/components/ui/investment-loader";
import { motion } from "framer-motion";

interface Feature {
  text: string;
}

interface InvestmentPlanProps {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  dailyProfit: number;
  description: string;
  features: Feature[];
  isPopular?: boolean;
}

export default function InvestmentPlanCard({
  id,
  name,
  minAmount,
  maxAmount,
  dailyProfit,
  description,
  features,
  isPopular = false,
}: InvestmentPlanProps) {
  const { toast } = useToast();
  
  const investMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", `/api/investments`, { planId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Investment successful",
        description: `You have successfully invested in the ${name} plan.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Investment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvest = () => {
    investMutation.mutate(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <Card 
        className={`overflow-hidden border ${isPopular ? "ring-2 ring-secondary-500" : "border-gray-200"}`}
      >
        <div className="p-5">
          <div className={`${isPopular ? "flex justify-between items-center" : ""}`}>
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              {name}
              <div className="w-5 h-5 ml-2">
                <InvestmentLoader type="trend" size="sm" text="" />
              </div>
            </h3>
            {isPopular && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 10 }}
              >
                <Badge variant="secondary" className="bg-secondary-100 text-secondary-800">
                  Popular
                </Badge>
              </motion.div>
            )}
          </div>
          <div className="mt-3 flex items-baseline">
            <motion.span 
              className="text-3xl font-semibold text-gray-900"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              ${minAmount.toLocaleString()}
            </motion.span>
            <motion.span 
              className="ml-1 text-xl text-gray-500"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              - ${maxAmount.toLocaleString()}
            </motion.span>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-center"
          >
            <div className="w-8 h-8 mr-2">
              <InvestmentLoader type="chart" size="sm" text="" />
            </div>
            <span className="text-green-600 font-medium">{dailyProfit}% Daily Profit</span>
          </motion.div>
          
          <motion.p 
            className="mt-3 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {description}
          </motion.p>
          
          <div className="mt-4">
            <div className="flex items-center">
              <div className="flex-1">
                {features.map((feature, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center mt-2 first:mt-0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (index * 0.1) }}
                  >
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <Button 
            className="w-full"
            onClick={handleInvest}
            disabled={investMutation.isPending}
          >
            {investMutation.isPending ? (
              <>
                <div className="mr-2">
                  <InvestmentLoader type="dollar" size="sm" text="" />
                </div>
                Processing...
              </>
            ) : (
              "Invest Now"
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
