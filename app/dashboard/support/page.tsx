"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { Loader2, Mail, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/translation";

export default function SupportPage() {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { translate } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !subject || !message) {
      toast({
        title: translate("Missing fields"),
        description: translate("Please fill in all required fields"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        userId: auth.currentUser!.uid,
        userEmail: auth.currentUser!.email,
        category,
        subject,
        message,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: translate("Support ticket submitted"),
        description: translate("We'll get back to you as soon as possible"),
      });

      // Reset form
      setCategory("");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Failed to submit support ticket. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Support")}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{translate("Contact Information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p>profitedge.netlify@gmail.com</p>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p>+1 (718) 650-3987</p>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <p>{translate("Live chat available 24/7")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate("Submit a Ticket")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">{translate("Category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={translate("Select category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">{translate("Account Issues")}</SelectItem>
                    <SelectItem value="deposit">{translate("Deposit Problems")}</SelectItem>
                    <SelectItem value="withdrawal">{translate("Withdrawal Issues")}</SelectItem>
                    <SelectItem value="kyc">{translate("KYC Verification")}</SelectItem>
                    <SelectItem value="technical">{translate("Technical Support")}</SelectItem>
                    <SelectItem value="other">{translate("Other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{translate("Subject")}</Label>
                <Input
                  id="subject"
                  placeholder={translate("Brief description of your issue")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{translate("Message")}</Label>
                <Textarea
                  id="message"
                  placeholder={translate("Describe your issue in detail")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translate("Submitting...")}
                  </>
                ) : (
                  translate("Submit Ticket")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
