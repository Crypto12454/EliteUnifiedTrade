import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const planFormSchema = z.object({
  name: z.string().min(3, "Plan name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  minAmount: z.coerce.number().min(1, "Minimum amount must be greater than 0"),
  maxAmount: z.coerce.number().min(1, "Maximum amount must be greater than 0"),
  dailyProfit: z.coerce.number().min(0.1, "Daily profit must be at least 0.1%"),
  isPopular: z.boolean().optional().default(false),
  features: z.array(z.object({
    text: z.string().min(3, "Feature must be at least 3 characters")
  })).min(1, "At least one feature is required")
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function PlansPage() {
  const { toast } = useToast();
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [features, setFeatures] = useState<string[]>([
    "Daily Profit",
    "24/7 Support",
    "Fast Withdrawals"
  ]);

  // Fetch all plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["/api/plans"],
  });

  // Form for adding a new plan
  const addPlanForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      minAmount: 500,
      maxAmount: 999,
      dailyProfit: 1.0,
      isPopular: false,
      features: [
        { text: "Daily Profit" },
        { text: "24/7 Support" },
        { text: "Fast Withdrawals" }
      ]
    },
  });

  // Form for editing an existing plan
  const editPlanForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      minAmount: 500,
      maxAmount: 999,
      dailyProfit: 1.0,
      isPopular: false,
      features: [
        { text: "Daily Profit" },
        { text: "24/7 Support" },
        { text: "Fast Withdrawals" }
      ]
    },
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const res = await apiRequest("POST", "/api/plans", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setIsAddPlanDialogOpen(false);
      addPlanForm.reset();
      toast({
        title: "Plan created",
        description: "Investment plan has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/plans/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setIsEditPlanDialogOpen(false);
      setSelectedPlan(null);
      toast({
        title: "Plan updated",
        description: "Investment plan has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("DELETE", `/api/plans/${planId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: "Plan deleted",
        description: "Investment plan has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAddPlanSubmit = (data: PlanFormValues) => {
    createPlanMutation.mutate(data);
  };

  const onEditPlanSubmit = (data: PlanFormValues) => {
    if (!selectedPlan) return;
    
    updatePlanMutation.mutate({
      ...data,
      id: selectedPlan.id,
    });
  };

  const handleDeletePlan = (planId: number) => {
    deletePlanMutation.mutate(planId);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    editPlanForm.reset({
      name: plan.name,
      description: plan.description,
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      dailyProfit: plan.dailyProfit,
      isPopular: plan.isPopular,
      features: plan.features || [
        { text: "Daily Profit" },
        { text: "24/7 Support" },
        { text: "Fast Withdrawals" }
      ]
    });
    setIsEditPlanDialogOpen(true);
  };

  const addFeature = (formHook: any) => {
    const currentFeatures = formHook.getValues("features") || [];
    formHook.setValue("features", [...currentFeatures, { text: "" }]);
  };

  const removeFeature = (formHook: any, index: number) => {
    const currentFeatures = formHook.getValues("features") || [];
    if (currentFeatures.length > 1) {
      formHook.setValue(
        "features",
        currentFeatures.filter((_: any, i: number) => i !== index)
      );
    }
  };

  return (
    <AdminLayout title="Investment Plans">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Investment Plans</CardTitle>
          <Dialog open={isAddPlanDialogOpen} onOpenChange={setIsAddPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Investment Plan</DialogTitle>
                <DialogDescription>
                  Create a new investment plan for your users.
                </DialogDescription>
              </DialogHeader>
              <Form {...addPlanForm}>
                <form onSubmit={addPlanForm.handleSubmit(onAddPlanSubmit)} className="space-y-4">
                  <FormField
                    control={addPlanForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Starter Plan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addPlanForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brief description of the plan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addPlanForm.control}
                      name="minAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addPlanForm.control}
                      name="maxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addPlanForm.control}
                    name="dailyProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Profit (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addPlanForm.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mark as Popular Plan</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel>Features</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFeature(addPlanForm)}
                      >
                        Add Feature
                      </Button>
                    </div>
                    {addPlanForm.watch("features")?.map((feature, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <FormField
                          control={addPlanForm.control}
                          name={`features.${index}.text`}
                          render={({ field }) => (
                            <FormItem className="flex-1 mr-2">
                              <FormControl>
                                <Input {...field} placeholder="Feature description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(addPlanForm, index)}
                          disabled={addPlanForm.watch("features").length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createPlanMutation.isPending || !addPlanForm.formState.isDirty}
                    >
                      {createPlanMutation.isPending ? (
                        <span className="mr-2 animate-spin">●</span>
                      ) : null}
                      Create Plan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Daily Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading plans...
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No investment plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan: any) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {plan.name}
                          {plan.isPopular && (
                            <Badge className="ml-2 bg-secondary-100 text-secondary-800">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {plan.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        ${plan.minAmount.toLocaleString()} - ${plan.maxAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {plan.dailyProfit}%
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the investment plan. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePlan(plan.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Investment Plan</DialogTitle>
            <DialogDescription>
              Update the details of the investment plan.
            </DialogDescription>
          </DialogHeader>
          <Form {...editPlanForm}>
            <form onSubmit={editPlanForm.handleSubmit(onEditPlanSubmit)} className="space-y-4">
              <FormField
                control={editPlanForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Starter Plan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPlanForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of the plan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPlanForm.control}
                  name="minAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editPlanForm.control}
                  name="maxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editPlanForm.control}
                name="dailyProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Profit (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPlanForm.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as Popular Plan</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>Features</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature(editPlanForm)}
                  >
                    Add Feature
                  </Button>
                </div>
                {editPlanForm.watch("features")?.map((feature, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <FormField
                      control={editPlanForm.control}
                      name={`features.${index}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-1 mr-2">
                          <FormControl>
                            <Input {...field} placeholder="Feature description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(editPlanForm, index)}
                      disabled={editPlanForm.watch("features").length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updatePlanMutation.isPending || !editPlanForm.formState.isDirty}
                >
                  {updatePlanMutation.isPending ? (
                    <span className="mr-2 animate-spin">●</span>
                  ) : null}
                  Update Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
