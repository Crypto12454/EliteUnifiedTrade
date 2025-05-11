import { useState, useEffect } from "react";
import { Redirect, Route } from "wouter";
import { LoadingPage } from "@/components/loading-page";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Different animation types for different routes
  const loaderType = path.includes("deposit") ? "dollar" : 
                     path.includes("withdraw") ? "coin" :
                     path.includes("transactions") ? "chart" :
                     path.includes("admin") ? "pie" : "trend";

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const res = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Clear invalid token
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        // Add a slight delay to show the animation
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    }
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Route path={path}>
        <LoadingPage type={loaderType} />
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check for admin routes
  if (path.startsWith("/admin") && user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
