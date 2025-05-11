import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { InvestmentLoader } from "@/components/ui/investment-loader";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconBgColor?: string;
  linkText?: string;
  linkHref?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary-500",
  linkText,
  linkHref,
}: StatsCardProps) {
  // Determine loader type based on title
  const getLoaderType = () => {
    if (title.toLowerCase().includes("balance")) return "dollar";
    if (title.toLowerCase().includes("profit")) return "trend";
    if (title.toLowerCase().includes("investment")) return "chart";
    return "default";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-center">
            <motion.div 
              className={`flex-shrink-0 ${iconBgColor} rounded-md p-3 text-white`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                  {title}
                  <div className="w-4 h-4 ml-2">
                    <InvestmentLoader type={getLoaderType()} size="sm" text="" />
                  </div>
                </dt>
                <dd>
                  <motion.div 
                    className="text-lg font-medium text-gray-900"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {value}
                  </motion.div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {linkText && linkHref && (
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a
                href={linkHref}
                className="font-medium text-primary-700 hover:text-primary-900 flex items-center"
              >
                <motion.span
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {linkText}
                </motion.span>
              </a>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
