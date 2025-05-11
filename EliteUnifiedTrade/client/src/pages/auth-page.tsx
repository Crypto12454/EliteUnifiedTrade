import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestmentLoader } from "@/components/ui/investment-loader";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const { toast } = useToast();
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Handle login form submission directly
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoginLoading(true);
      const res = await apiRequest("POST", "/api/login", data);
      const responseData = await res.json();
      
      // Store token in localStorage
      localStorage.setItem("token", responseData.token);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${responseData.user.email}!`,
      });
      
      // Redirect based on role
      navigate(responseData.user.role === "admin" ? "/admin" : "/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handle registration form submission directly
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsRegisterLoading(true);
      const res = await apiRequest("POST", "/api/register", data);
      const responseData = await res.json();
      
      // Store token in localStorage
      localStorage.setItem("token", responseData.token);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });
      
      // Redirect to dashboard
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left column - Form */}
      <div className="w-full xl:w-1/2 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EliteUnifiedTrade
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Elevate your investments, maximize your returns
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Login to your account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="you@example.com" 
                                {...field} 
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                autoComplete="current-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoginLoading}
                      >
                        {isLoginLoading ? (
                          <div className="flex items-center justify-center">
                            <InvestmentLoader type="dollar" size="sm" text="" className="mr-2" />
                            <span>Verifying credentials...</span>
                          </div>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                autoComplete="name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="you@example.com" 
                                {...field} 
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isRegisterLoading}
                      >
                        {isRegisterLoading ? (
                          <div className="flex items-center justify-center">
                            <InvestmentLoader type="chart" size="sm" text="" className="mr-2" />
                            <span>Creating your account...</span>
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

          </Card>
        </div>
      </div>
      
      {/* Right column - Hero Section */}
      <div className="hidden xl:block xl:w-1/2 bg-gradient-to-br from-primary/90 to-secondary/90">
        <div className="h-full flex items-center justify-center text-white p-12">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold mb-6">
              Smart Investments for a Secure Future
            </h1>
            <p className="text-lg mb-8">
              Elite Unified Trade provides you with premium investment opportunities. Start with our starter plan and grow your portfolio with expert guidance.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <h3 className="font-bold text-xl mb-2">Secure Platform</h3>
                <p className="text-white/80">State-of-the-art security measures to protect your investments</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <h3 className="font-bold text-xl mb-2">Daily Profits</h3>
                <p className="text-white/80">Earn consistent daily profits from your investments</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <h3 className="font-bold text-xl mb-2">Multiple Plans</h3>
                <p className="text-white/80">Choose from various investment plans tailored to your needs</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <h3 className="font-bold text-xl mb-2">Fast Withdrawals</h3>
                <p className="text-white/80">Request withdrawals anytime with quick processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
