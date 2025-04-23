"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/translation";

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  response?: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState("");
  const { toast } = useToast();
  const { translate } = useTranslation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const q = query(
          collection(db, "support_tickets"),
          where("status", "==", "open")
        );
        const querySnapshot = await getDocs(q);
        const ticketsData: SupportTicket[] = [];
        
        querySnapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() } as SupportTicket);
        });
        
        setTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching support tickets:", error);
        toast({
          title: translate("Error"),
          description: translate("Failed to fetch support tickets"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [toast, translate]);

  const handleRespondToTicket = async (ticketId: string) => {
    if (!response.trim()) {
      toast({
        title: translate("Error"),
        description: translate("Please enter a response"),
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "support_tickets", ticketId), {
        status: "resolved",
        response,
        resolvedAt: new Date().toISOString()
      });
      
      toast({
        title: translate("Success"),
        description: translate("Response sent successfully"),
      });
      
      // Remove from list
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
      setResponse("");
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Failed to send response"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Support Tickets")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{translate("Open Tickets")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce"></div>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {translate("No open support tickets")}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("User")}</TableHead>
                    <TableHead>{translate("Category")}</TableHead>
                    <TableHead>{translate("Subject")}</TableHead>
                    <TableHead>{translate("Date")}</TableHead>
                    <TableHead>{translate("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {translate(ticket.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {translate("Respond")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{translate("Respond to Ticket")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">{translate("User Message")}</h4>
                                <div className="rounded-lg border p-4 text-sm">
                                  {ticket.message}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-medium">{translate("Your Response")}</h4>
                                <Textarea
                                  placeholder={translate("Type your response...")}
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handleRespondToTicket(ticket.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {translate("Send Response")}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}