"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { useTranslation } from "@/lib/translation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, TrendingUp, Timer, DollarSign, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "Starter Plan",
    description: "Perfect for beginners looking to enter the crypto market",
    amount: 1000,
    dailyRoi: 25,
    duration: 5,
    referralBonus: 2,
    features: [
      "25% daily returns",
      "5 days duration",
      "2% referral bonus",
      "Capital accessible after maturity",
      "24/7 Support",
      "Real-time tracking"
    ]
  },
  {
    id: "growth",
    name: "Growth Plan",
    description: "Ideal for investors seeking substantial growth",
    amount: 5000,
    dailyRoi: 30,
    duration: 14,
    referralBonus: 5,
    features: [
      "30% daily returns",
      "14 days duration",
      "5% referral bonus",
      "Capital accessible after maturity",
      "Priority support",
      "Advanced analytics"
    ]
  },
  {
    id: "premium",
    name: "Premium Plan",
    description: "For serious investors seeking maximum returns",
    amount: 10000,
    dailyRoi: 45,
    duration: 21,
    referralBonus: 8,
    features: [
      "45% daily returns",
      "21 days duration",
      "8% referral bonus",
      "Capital accessible after maturity",
      "VIP support",
      "Expert consultation"
    ]
  }
];

interface Investment {
  id: string;
  planId: string;
  amount: number;
  startDate: string;
  endDate: string;
  expectedReturn: number;
  progress: number;
  status: 'pending' | 'active' | 'completed';
}

export default function InvestPage() {
  const [selectedPlan, setSelectedPlan] = useState(INVESTMENT_PLANS[0]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [balance, setBalance] = useState(0);
  const { toast } = useToast();
  const { translate } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setBalance(userData.balance || 0);
          setInvestments(userData.investments || []);

          // Check for matured investments
          const now = new Date().getTime();
          const maturedInvestments = (userData.investments || []).filter(
            (inv: Investment) => 
              inv.status === 'active' && 
              new Date(inv.endDate).getTime() <= now
          );

          if (maturedInvestments.length > 0) {
            // Calculate total returns
            const totalReturns = maturedInvestments.reduce(
              (sum: number, inv: Investment) => sum + inv.expectedReturn, 
              0
            );

            // Update user's balance and investment status
            await updateDoc(docRef, {
              balance: (userData.balance || 0) + totalReturns,
              investments: (userData.investments || []).map((inv: Investment) => ({
                ...inv,
                status: new Date(inv.endDate).getTime() <= now ? 'completed' : inv.status
              }))
            });

            // Refresh data
            const updatedDoc = await getDoc(docRef);
            if (updatedDoc.exists()) {
              const updatedData = updatedDoc.data();
              setBalance(updatedData.balance || 0);
              setInvestments(updatedData.investments || []);
            }

            toast({
              title: translate("Investment(s) Matured!"),
              description: `$${totalReturns.toFixed(2)} ${translate("has been added to your balance.")}`,
            });
          }
        }
      }
    };

    fetchUserData();
  }, [toast, translate]);

  const handleInvestment = async () => {
    const investAmount = Number(amount);
    
    if (!investAmount || investAmount <= 0) {
      toast({
        title: translate("Invalid amount"),
        description: translate("Please enter a valid amount"),
        variant: "destructive",
      });
      return;
    }

    if (investAmount > balance) {
      toast({
        title: translate("Insufficient funds"),
        description: translate("Please deposit more funds to make this investment"),
        variant: "destructive",
      });
      router.push("/dashboard/wallet");
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration);

      const newInvestment: Investment = {
        id: crypto.randomUUID(),
        planId: selectedPlan.id,
        amount: investAmount,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        expectedReturn: investAmount * (1 + (selectedPlan.dailyRoi * selectedPlan.duration) / 100),
        progress: 0,
        status: 'active'
      };

      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        balance: balance - investAmount,
        investments: [...investments, newInvestment]
      });

      setBalance(balance - investAmount);
      setInvestments([...investments, newInvestment]);
      setAmount("");

      toast({
        title: translate("Investment successful"),
        description: translate(`You have invested $${investAmount} in ${selectedPlan.name}`),
      });
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Failed to process investment. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Investment Plans")}</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {INVESTMENT_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan.id === plan.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{translate(plan.name)}</span>
                <TrendingUp className={`h-5 w-5 ${
                  selectedPlan.id === plan.id ? 'text-blue-500' : 'text-gray-400'
                }`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-600">${plan.amount}</p>
                <p className="text-xl font-semibold text-green-600">{plan.dailyRoi}% {translate("Daily ROI")}</p>
                <p className="text-sm text-muted-foreground">{translate(plan.description)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Timer className="mr-2 h-4 w-4" />
                  {plan.duration} {translate("days duration")}
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {plan.referralBonus}% {translate("referral bonus")}
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    {translate(feature)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            {translate("Start Investing")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("Invest in")} {translate(selectedPlan.name)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{translate("Investment Amount (USD)")}</Label>
              <Input
                type="number"
                placeholder={translate("Enter investment amount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {translate("Available Balance")}: ${balance}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{translate("Expected Return")}</p>
              <p className="text-2xl font-bold text-green-600">
                ${amount ? (Number(amount) * (1 + (selectedPlan.dailyRoi * selectedPlan.duration) / 100)).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-muted-foreground">
                {translate("After")} {selectedPlan.duration} {translate("days")}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleInvestment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("Processing...")}
                </>
              ) : (
                translate("Confirm Investment")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <h3 className="text-xl font-semibold mt-8">{translate("Active Investments")}</h3>
      <div className="space-y-4">
        {investments.map((investment, index) => {
          const plan = INVESTMENT_PLANS.find(p => p.id === investment.planId)!;
          const progress = calculateProgress(investment.startDate, investment.endDate);
          
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold">{translate(plan.name)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {translate("Started")} {new Date(investment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${investment.amount}</p>
                    <p className="text-sm text-green-600">
                      {translate("Expected")}: ${investment.expectedReturn}
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>{translate("Progress")}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {translate("Matures on")} {new Date(investment.endDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {investments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {translate("No active investments")}
          </div>
        )}
      </div>
    </div>
  );
}