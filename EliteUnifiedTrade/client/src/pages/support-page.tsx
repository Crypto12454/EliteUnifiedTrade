import React from "react";
import UserLayout from "@/components/layout/user-layout";
import ChatInterface from "@/components/chat/chat-interface";
import { LoadingPage } from "@/components/loading-page";
import { useAuth } from "@/hooks/use-auth";

export default function SupportPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage fullScreen type="dollar" />;
  }

  return (
    <UserLayout title="Customer Support">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
            How Can We Help You?
          </h1>
          <p className="text-lg text-muted-foreground">
            Our support team is here to assist you with any questions or concerns about your investments.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="rounded-lg border p-6 h-full">
              <h2 className="text-xl font-semibold mb-4">FAQs</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">How do I make a deposit?</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Deposit page, enter your desired amount, and follow the instructions to complete your crypto payment.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">When can I withdraw my profits?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can withdraw your profits at any time by going to the Withdraw page. Standard processing time is 24-48 hours.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">How is my investment return calculated?</h3>
                  <p className="text-sm text-muted-foreground">
                    Returns are calculated based on the daily profit percentage of your selected investment plan. They are credited to your account daily.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Is there a minimum investment amount?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, each investment plan has a minimum amount requirement. You can view these details on the Plans section of the dashboard.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">How do I update my profile information?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can update your profile information by visiting the Profile page in your account dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <ChatInterface />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}