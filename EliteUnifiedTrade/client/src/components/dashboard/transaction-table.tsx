import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: number;
  date: string;
  type: "deposit" | "withdrawal" | "profit";
  amount: number;
  status: "completed" | "pending" | "failed";
  currency?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  // Format amount with sign based on type
  const formatAmount = (transaction: Transaction) => {
    const sign = transaction.type === "withdrawal" ? "-" : "+";
    return `${sign}$${Math.abs(transaction.amount).toFixed(2)}`;
  };

  // Determine text color for amount
  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === "withdrawal") return "text-red-600";
    return "text-green-600";
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(transaction.date).toLocaleDateString()}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                {transaction.type}
              </TableCell>
              <TableCell 
                className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAmountColor(transaction)}`}
              >
                {formatAmount(transaction)}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(transaction.status)}
              </TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
