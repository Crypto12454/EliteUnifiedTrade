import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function WithdrawalsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Fetch withdrawals
  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["/api/admin/withdrawals", statusFilter],
  });

  // Approve withdrawal mutation
  const approveWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/withdrawals/${withdrawalId}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal request has been approved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject withdrawal mutation
  const rejectWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/withdrawals/${withdrawalId}/reject`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal request has been rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApproveWithdrawal = (withdrawalId: number) => {
    approveWithdrawalMutation.mutate(withdrawalId);
  };

  const handleRejectWithdrawal = (withdrawalId: number) => {
    rejectWithdrawalMutation.mutate(withdrawalId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Withdrawal Requests">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Withdrawal Requests</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading withdrawal requests...
                    </TableCell>
                  </TableRow>
                ) : withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No withdrawal requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((withdrawal: any) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user?.fullName || "User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.user?.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        ${withdrawal.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {withdrawal.walletAddress}
                        </div>
                        <div className="text-sm text-gray-500">{withdrawal.currency}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {withdrawal.reason || "N/A"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(withdrawal.status)}
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === "pending" ? (
                          <div className="flex space-x-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100">
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Withdrawal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve this withdrawal request for ${withdrawal.amount.toFixed(2)}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Withdrawal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this withdrawal request for ${withdrawal.amount.toFixed(2)}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {withdrawal.status === "completed" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
