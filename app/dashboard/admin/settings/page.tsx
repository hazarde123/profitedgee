"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";

interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  minDepositAmount: number;
  maxWithdrawalAmount: number;
  referralBonusAmount: number;
  supportEmail: string;
  supportPhone: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    minDepositAmount: 100,
    maxWithdrawalAmount: 10000,
    referralBonusAmount: 100,
    supportEmail: "support@cryptonow.com",
    supportPhone: "+1 (888) 123-4567"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { translate } = useTranslation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "system", "settings");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SystemSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: translate("Error"),
          description: translate("Failed to fetch system settings"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast, translate]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        ...settings
      } as { [key: string]: any };
      await updateDoc(doc(db, "system", "settings"), settingsData);
      
      toast({
        title: translate("Success"),
        description: translate("Settings updated successfully"),
      });
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Failed to update settings"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">{translate("System Settings")}</h2>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? translate("Saving...") : translate("Save Changes")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{translate("General Settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{translate("Maintenance Mode")}</Label>
                <p className="text-sm text-muted-foreground">
                  {translate("Disable all user operations except admin access")}
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{translate("User Registration")}</Label>
                <p className="text-sm text-muted-foreground">
                  {translate("Allow new users to register")}
                </p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, registrationEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate("Transaction Limits")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{translate("Minimum Deposit Amount (USD)")}</Label>
              <Input
                type="number"
                value={settings.minDepositAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minDepositAmount: Number(e.target.value)
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{translate("Maximum Withdrawal Amount (USD)")}</Label>
              <Input
                type="number"
                value={settings.maxWithdrawalAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxWithdrawalAmount: Number(e.target.value)
                   })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{translate("Referral Bonus Amount (USD)")}</Label>
              <Input
                type="number"
                value={settings.referralBonusAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    referralBonusAmount: Number(e.target.value)
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate("Support Contact Information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{translate("Support Email")}</Label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supportEmail: e.target.value
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{translate("Support Phone")}</Label>
              <Input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supportPhone: e.target.value
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}