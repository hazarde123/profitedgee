"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, getDocs, where } from "firebase/firestore";
import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { translate } = useTranslation();

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        title: translate("Error"),
        description: translate("Please fill in all fields"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get users based on type
      const usersRef = collection(db, "users");
      const q = type !== "all" 
        ? query(usersRef, where("role", "==", type))
        : query(usersRef);
      
      const querySnapshot = await getDocs(q);
      
      // Create notifications for each user
      const notifications = querySnapshot.docs.map(doc => ({
        userId: doc.id,
        title,
        message,
        type: "system",
        read: false,
        createdAt: new Date().toISOString()
      }));

      // Batch create notifications
      await Promise.all(
        notifications.map(notification =>
          addDoc(collection(db, "notifications"), notification)
        )
      );

      toast({
        title: translate("Success"),
        description: translate("Notifications sent successfully"),
      });

      // Reset form
      setTitle("");
      setMessage("");
      setType("all");
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Failed to send notifications"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Send Notifications")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{translate("Create System Notification")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendNotification} className="space-y-6">
            <div className="space-y-2">
              <Label>{translate("Recipient Group")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder={translate("Select recipient group")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate("All Users")}</SelectItem>
                  <SelectItem value="user">{translate("Regular Users Only")}</SelectItem>
                  <SelectItem value="admin">{translate("Admins Only")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{translate("Notification Title")}</Label>
              <Input
                placeholder={translate("Enter notification title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{translate("Message")}</Label>
              <Textarea
                placeholder={translate("Enter notification message")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Bell className="mr-2 h-4 w-4 animate-pulse" />
                  {translate("Sending...")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {translate("Send Notification")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}