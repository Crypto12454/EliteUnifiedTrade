import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, LineChart, Coins, BarChart3, PieChart } from "lucide-react";

type LoaderType = "chart" | "coin" | "dollar" | "default" | "trend" | "pie";
type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";

interface InvestmentLoaderProps {
  type?: LoaderType;
  size?: LoaderSize;
  text?: string;
  className?: string;
}

const sizeClasses = {
  xs: "text-xs h-8",
  sm: "text-sm h-16",
  md: "text-base h-24",
  lg: "text-lg h-32",
  xl: "text-xl h-40",
};

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export function InvestmentLoader({
  type = "default",
  size = "md",
  text = "Loading...",
  className,
}: InvestmentLoaderProps) {
  const IconComponent = getIconByType(type);
  const iconSize = iconSizes[size];
  
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <LoaderAnimation type={type} size={size} IconComponent={IconComponent} iconSize={iconSize} />
      {text && <p className={cn("text-muted-foreground animate-pulse", `text-${size}`)}>{text}</p>}
    </div>
  );
}

function getIconByType(type: LoaderType) {
  switch (type) {
    case "chart":
      return LineChart;
    case "coin":
      return Coins;
    case "dollar":
      return DollarSign;
    case "trend":
      return TrendingUp;
    case "pie":
      return PieChart;
    default:
      return BarChart3;
  }
}

interface LoaderAnimationProps {
  type: LoaderType;
  size: LoaderSize;
  IconComponent: React.ElementType;
  iconSize: number;
}

function LoaderAnimation({ type, size, IconComponent, iconSize }: LoaderAnimationProps) {
  switch (type) {
    case "chart":
      return <ChartAnimation size={size} IconComponent={IconComponent} iconSize={iconSize} />;
    case "coin":
      return <CoinAnimation size={size} IconComponent={IconComponent} iconSize={iconSize} />;
    case "dollar":
      return <DollarAnimation size={size} IconComponent={IconComponent} iconSize={iconSize} />;
    case "trend":
      return <TrendAnimation size={size} IconComponent={IconComponent} iconSize={iconSize} />;
    case "pie":
      return <PieAnimation size={size} IconComponent={IconComponent} iconSize={iconSize} />;
    default:
      return <DefaultAnimation size={size} IconComponent={IconComponent} iconSize={iconSize} />;
  }
}

function DefaultAnimation({ size, IconComponent, iconSize }: { size: LoaderSize, IconComponent: React.ElementType, iconSize: number }) {
  return (
    <motion.div
      className={cn("relative flex items-center justify-center", sizeClasses[size])}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <IconComponent size={iconSize} className="text-primary" />
    </motion.div>
  );
}

function ChartAnimation({ size, IconComponent, iconSize }: { size: LoaderSize, IconComponent: React.ElementType, iconSize: number }) {
  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scaleY: 0.5, opacity: 0.2 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      >
        <IconComponent size={iconSize} className="text-primary" />
      </motion.div>
      <motion.div
        className="absolute"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: -10, opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      >
        <IconComponent size={iconSize * 0.7} className="text-primary/70" />
      </motion.div>
    </div>
  );
}

function CoinAnimation({ size, IconComponent, iconSize }: { size: LoaderSize, IconComponent: React.ElementType, iconSize: number }) {
  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
      <motion.div
        className="absolute flex items-center justify-center"
        animate={{ 
          rotateY: [0, 180, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <IconComponent size={iconSize} className="text-yellow-500" />
      </motion.div>
      
      {/* Scattered smaller coins */}
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0.2,
            opacity: 0 
          }}
          animate={{ 
            x: (index - 1) * 20, 
            y: -20 - (index * 10),
            scale: 0.4,
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: index * 0.3,
            ease: "easeOut" 
          }}
        >
          <IconComponent size={iconSize * 0.5} className="text-yellow-400" />
        </motion.div>
      ))}
    </div>
  );
}

function DollarAnimation({ size, IconComponent, iconSize }: { size: LoaderSize, IconComponent: React.ElementType, iconSize: number }) {
  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
      <motion.div
        className="bg-green-100 rounded-full p-2"
        animate={{ 
          scale: [1, 1.1, 1],
          boxShadow: [
            "0px 0px 0px rgba(0, 200, 0, 0.3)",
            "0px 0px 15px rgba(0, 200, 0, 0.5)",
            "0px 0px 0px rgba(0, 200, 0, 0.3)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <IconComponent size={iconSize} className="text-green-600" />
      </motion.div>
      
      {/* Rising dollar symbols */}
      {[...Array(5)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute text-green-500 text-xs font-bold"
          initial={{ 
            y: 0, 
            x: (index - 2) * 10,
            opacity: 0 
          }}
          animate={{ 
            y: -30,
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: index * 0.2,
            ease: "easeOut" 
          }}
        >
          $
        </motion.div>
      ))}
    </div>
  );
}

function TrendAnimation({ size, IconComponent, iconSize }: { size: LoaderSize, IconComponent: React.ElementType, iconSize: number }) {
  const pathLength = 20;
  
  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
      <motion.div
        className="text-green-500"
        animate={{ 
          y: [5, -5, 5],
          rotateZ: [0, 5, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <IconComponent size={iconSize} />
      </motion.div>
      
      {/* Drawing trend line */}
      <motion.svg
        className="absolute"
        width={iconSize * 1.5}
        height={iconSize * 1.5}
        viewBox={`0 0 ${pathLength} ${pathLength}`}
        initial="hidden"
        animate="visible"
      >
        <motion.path
          d={`M1,${pathLength-1} L5,15 L10,18 L15,10 L${pathLength-1},1`}
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="0.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}

function PieAnimation({ size, IconComponent, iconSize }: { size: LoaderSize, IconComponent: React.ElementType, iconSize: number }) {
  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <IconComponent size={iconSize} className="text-primary" />
      </motion.div>
      
      {/* Colored sections appearing */}
      {[
        { color: "rgba(99, 102, 241, 0.3)", delay: 0 },
        { color: "rgba(239, 68, 68, 0.3)", delay: 0.5 },
        { color: "rgba(16, 185, 129, 0.3)", delay: 1 },
        { color: "rgba(245, 158, 11, 0.3)", delay: 1.5 }
      ].map((section, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{ 
            backgroundColor: section.color,
            width: iconSize * 0.4,
            height: iconSize * 0.4
          }}
          initial={{ 
            x: 0, 
            y: 0,
            scale: 0,
            opacity: 0 
          }}
          animate={{ 
            x: Math.cos(index * Math.PI/2) * (iconSize * 0.5),
            y: Math.sin(index * Math.PI/2) * (iconSize * 0.5),
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            delay: section.delay,
            ease: "easeInOut" 
          }}
        />
      ))}
    </div>
  );
}