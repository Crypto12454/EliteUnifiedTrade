import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Loader2, Send } from "lucide-react";

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

export default function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat/messages"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat',
          content,
        }));
        return null;
      } else {
        const res = await apiRequest("POST", "/api/chat/messages", { content });
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
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
        console.log("WebSocket connected");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "admin_reply") {
            queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
            toast({
              title: "New Message",
              description: "You received a response from support",
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Error connecting to chat service. Please refresh.",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      return () => {
        ws.close();
      };
    }
  }, [user, queryClient, toast]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Support Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[450px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Support Chat</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px] pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Send a message to get support from our team.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: ChatMessage) => (
                <div key={msg.id} className="space-y-2">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">You</span>
                      <span className="text-muted-foreground">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p>{msg.content}</p>
                  </div>
                  {msg.adminResponse && (
                    <div className="bg-secondary/20 p-3 rounded-lg ml-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Support Team</span>
                        <span className="text-muted-foreground">{formatDate(msg.updatedAt)}</span>
                      </div>
                      <p>{msg.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="resize-none"
          />
          <Button 
            type="submit" 
            disabled={sendMessageMutation.isPending || !message.trim()}
            size="icon"
          >
            {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}