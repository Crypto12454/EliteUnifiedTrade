import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, User } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Loader2, Send, MessageCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

type ExtendedChatMessage = ChatMessage & {
  user: User;
};

export default function AdminChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ExtendedChatMessage | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const { data: unreadMessages = [], isLoading: unreadLoading } = useQuery({
    queryKey: ["/api/admin/chat/messages/unread"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: allMessages = [], isLoading: allLoading } = useQuery({
    queryKey: ["/api/admin/chat/messages"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const respondToMessageMutation = useMutation({
    mutationFn: async ({ messageId, adminResponse }: { messageId: number; adminResponse: string }) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'admin_reply',
          messageId,
          content: adminResponse,
        }));
      }
      
      const res = await apiRequest("PATCH", `/api/admin/chat/messages/${messageId}`, { 
        adminResponse,
        status: "replied"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/messages/unread"] });
      setResponse("");
      setSelectedMessage(null);
      toast({
        title: "Success",
        description: "Response sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send response: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected (admin)");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_message") {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/messages"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/messages/unread"] });
            toast({
              title: "New Message",
              description: "You received a new support message",
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      return () => {
        ws.close();
      };
    }
  }, [user, queryClient, toast]);

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMessage && response.trim()) {
      respondToMessageMutation.mutate({
        messageId: selectedMessage.id,
        adminResponse: response,
      });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return <Badge variant="destructive">Unread</Badge>;
      case "read":
        return <Badge variant="outline">Read</Badge>;
      case "replied":
        return <Badge variant="success">Replied</Badge>;
      default:
        return null;
    }
  };

  const renderMessageList = (messages: ExtendedChatMessage[]) => {
    if (messages.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="mx-auto h-8 w-8 mb-2" />
          <p>No messages to display</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedMessage?.id === message.id 
                ? "bg-primary/5 border-primary" 
                : "hover:bg-muted/50"
            }`}
            onClick={() => setSelectedMessage(message)}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="font-medium">{message.user.fullName || message.user.email}</div>
              {statusBadge(message.status)}
            </div>
            <p className="text-sm line-clamp-1">{message.content}</p>
            <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
              <span>ID: {message.user.id}</span>
              <span>{formatDate(message.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (unreadLoading || allLoading) {
    return (
      <Card className="h-[650px]">
        <CardHeader>
          <CardTitle>Customer Support Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[450px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-8 gap-4 h-[650px]">
      {/* Messages List */}
      <Card className="md:col-span-3 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Customer Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unread">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="unread" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Unread ({unreadMessages.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                All Messages
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unread">
              <ScrollArea className="h-[450px] pr-4">
                {renderMessageList(unreadMessages)}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="all">
              <ScrollArea className="h-[450px] pr-4">
                {renderMessageList(allMessages)}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conversation View */}
      <Card className="md:col-span-5 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            {selectedMessage 
              ? `Conversation with ${selectedMessage.user.fullName || selectedMessage.user.email}` 
              : "Select a message"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedMessage ? (
            <div className="flex flex-col items-center justify-center h-[450px] text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4" />
              <p>Select a message from the list to view the conversation</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{selectedMessage.user.fullName || selectedMessage.user.email}</span>
                    <span className="text-muted-foreground">{formatDate(selectedMessage.createdAt)}</span>
                  </div>
                  <p>{selectedMessage.content}</p>
                </div>
                {selectedMessage.adminResponse && (
                  <div className="bg-secondary/20 p-3 rounded-lg ml-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">You (Support)</span>
                      <span className="text-muted-foreground">{formatDate(selectedMessage.updatedAt)}</span>
                    </div>
                    <p>{selectedMessage.adminResponse}</p>
                  </div>
                )}
              </div>
              
              {!selectedMessage.adminResponse && (
                <form onSubmit={handleSendResponse} className="space-y-2">
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="resize-none min-h-[120px]"
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={respondToMessageMutation.isPending || !response.trim()}
                  >
                    {respondToMessageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Response
                      </>
                    )}
                  </Button>
                </form>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}