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
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/translation";

interface KYCRequest {
  id: string;
  userId: string;
  userEmail: string;
  documentUrl: string;
  status: string;
  submittedAt: string;
}

export default function KYCPage() {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { translate } = useTranslation();

  useEffect(() => {
    const fetchKYCRequests = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("kycStatus", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        const kycRequests: KYCRequest[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          kycRequests.push({
            id: doc.id,
            userId: doc.id,
            userEmail: data.email,
            documentUrl: data.kycDocument,
            status: data.kycStatus,
            submittedAt: data.kycSubmittedAt,
          });
        });
        
        setRequests(kycRequests);
      } catch (error) {
        console.error("Error fetching KYC requests:", error);
        toast({
          title: translate("Error"),
          description: translate("Failed to fetch KYC requests"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchKYCRequests();
  }, [toast, translate]);

  const handleKYCAction = async (userId: string, action: "approve" | "reject") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        kycStatus: action === "approve" ? "verified" : "rejected"
      });
      
      toast({
        title: translate("Success"),
        description: translate(`KYC request ${action}d successfully`),
      });
      
      // Remove from list
      setRequests(requests.filter(req => req.userId !== userId));
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate(`Failed to ${action} KYC request`),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("KYC Verification Requests")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{translate("Pending Verifications")}</CardTitle>
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
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {translate("No pending KYC requests")}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("User")}</TableHead>
                    <TableHead>{translate("Submitted")}</TableHead>
                    <TableHead>{translate("Document")}</TableHead>
                    <TableHead>{translate("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.userEmail}</TableCell>
                      <TableCell>
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {translate("View Document")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{translate("KYC Document")}</DialogTitle>
                            </DialogHeader>
                            <div className="aspect-video">
                              <img
                                src={request.documentUrl}
                                alt={translate("KYC Document")}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleKYCAction(request.userId, "approve")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {translate("Approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleKYCAction(request.userId, "reject")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {translate("Reject")}
                          </Button>
                        </div>
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