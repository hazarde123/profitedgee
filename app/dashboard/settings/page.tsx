"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db, storage } from "@/lib/firebase";
import { useTranslation } from "@/lib/translation";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { translate } = useTranslation();

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: translate("Error"),
        description: translate("Please select a document to upload"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const storageRef = ref(storage, `kyc/${auth.currentUser!.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", auth.currentUser!.uid), {
        kycStatus: "pending",
        kycDocument: downloadURL,
        kycSubmittedAt: new Date().toISOString()
      });

      toast({
        title: translate("KYC submitted successfully"),
        description: translate("We will review your documents shortly."),
      });
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Failed to submit KYC. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Settings")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{translate("KYC Verification")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleKYCSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kyc">{translate("Upload Identity Document")}</Label>
              <Input
                id="kyc"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                {translate("Please upload a clear photo of your government-issued ID")}
              </p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("Submitting...")}
                </>
              ) : (
                translate("Submit KYC")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}