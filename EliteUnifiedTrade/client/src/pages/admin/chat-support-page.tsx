import React from "react";
import AdminLayout from "@/components/layout/admin-layout";
import AdminChatInterface from "@/components/chat/admin-chat-interface";
import { LoadingPage } from "@/components/loading-page";
import { useAuth } from "@/hooks/use-auth";

export default function AdminChatSupportPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage fullScreen type="pie" />;
  }

  return (
    <AdminLayout title="Support Chat Management">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
          Customer Support Chat
        </h1>
        <p className="text-muted-foreground">
          Manage and respond to customer support inquiries. Unread messages are prioritized at the top.
        </p>
      </div>
      
      <AdminChatInterface />
    </AdminLayout>
  );
}