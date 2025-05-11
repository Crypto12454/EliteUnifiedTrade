import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// This is a simple redirect page to the dashboard
export default function HomePage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/auth");
    }
  }, [user, isAdmin, navigate]);

  return null;
}
