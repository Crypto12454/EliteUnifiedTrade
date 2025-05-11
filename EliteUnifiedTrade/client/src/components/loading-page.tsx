import React from "react";
import { InvestmentLoader } from "@/components/ui/investment-loader";
import { cn } from "@/lib/utils";

interface LoadingPageProps {
  message?: string;
  type?: "chart" | "coin" | "dollar" | "default" | "trend" | "pie";
  className?: string;
  fullScreen?: boolean;
}

export function LoadingPage({
  message = "Processing your investment data...",
  type = "default", 
  className,
  fullScreen = true,
}: LoadingPageProps) {
  const randomMessages = [
    "Analyzing market trends...",
    "Calculating your profits...",
    "Securing your investments...",
    "Optimizing your portfolio...",
    "Connecting to financial servers...",
    "Preparing your dashboard...",
    "Updating investment metrics...",
    "Fetching latest market data...",
  ];
  
  const [loadingMessage, setLoadingMessage] = React.useState(message);
  
  React.useEffect(() => {
    // Change the message periodically to make loading more engaging
    if (message === "Processing your investment data...") {
      const interval = setInterval(() => {
        setLoadingMessage(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [message]);
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background",
      fullScreen ? "fixed inset-0 z-50" : "w-full py-12",
      className
    )}>
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <InvestmentLoader type={type} size="lg" text={loadingMessage} />
        
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            EliteUnifiedTrade is committed to providing you with accurate financial information.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoadingSection({
  message,
  type = "default",
  className,
}: Omit<LoadingPageProps, "fullScreen">) {
  return (
    <LoadingPage
      message={message}
      type={type}
      className={className}
      fullScreen={false}
    />
  );
}

export function LoadingOverlay({
  message,
  type = "dollar",
  className,
}: Omit<LoadingPageProps, "fullScreen">) {
  return (
    <div className={cn(
      "absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <InvestmentLoader type={type} size="md" text={message} />
    </div>
  );
}