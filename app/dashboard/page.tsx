"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ArrowUpRight, Coins, DollarSign, TrendingUp, Users, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";

interface Investment {
  id: string;
  amount: number;
  progress: number;
  expectedReturn: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  timestamp: string;
  bonus?: number;
}

interface UserData {
  balance: number;
  investments: Investment[];
  transactions: Transaction[];
  myReferralCode: string;
  referralCount: number;
  totalReferralBonus: number;
  totalProfit: number;
  totalDeposits: number;
}

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const [profitChange, setProfitChange] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const { toast } = useToast();
  const { translate, currentLanguage } = useTranslation();

  // Format numbers according to current language locale
  const formatNumber = useMemo(() => {
    const locale = currentLanguage === 'EN' ? 'en-US' : 
                  currentLanguage === 'ES' ? 'es' :
                  currentLanguage === 'FR' ? 'fr' :
                  currentLanguage === 'DE' ? 'de' :
                  currentLanguage === 'ZH' ? 'zh' :
                  currentLanguage === 'JA' ? 'ja' :
                  currentLanguage === 'KO' ? 'ko' :
                  currentLanguage === 'AR' ? 'ar' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    });
  }, [currentLanguage]);

  // Format dates according to current language locale
  const formatDate = useMemo(() => {
    const locale = currentLanguage === 'EN' ? 'en-US' : 
                  currentLanguage === 'ES' ? 'es' :
                  currentLanguage === 'FR' ? 'fr' :
                  currentLanguage === 'DE' ? 'de' :
                  currentLanguage === 'ZH' ? 'zh' :
                  currentLanguage === 'JA' ? 'ja' :
                  currentLanguage === 'KO' ? 'ko' :
                  currentLanguage === 'AR' ? 'ar' : 'en-US';
    
    return new Intl.DateTimeFormat(locale);
  }, [currentLanguage]);

  useEffect(() => {
    const calculateStats = (userData: UserData) => {
      try {
        // Calculate total deposits
        if (typeof userData.totalDeposits === 'number') {
          setTotalDeposits(userData.totalDeposits);
        } else {
          const calculatedDeposits = userData.transactions
            ?.filter(t => t.type === 'deposit' && t.status === 'approved')
            .reduce((total, t) => total + t.amount, 0) || 0;
          setTotalDeposits(calculatedDeposits);
        }

        // Calculate total profit
        if (typeof userData.totalProfit === 'number') {
          setTotalProfit(userData.totalProfit);
        } else {
          let totalInvestmentProfit = 0;
          let totalBonusProfit = 0;

          if (Array.isArray(userData.investments)) {
            totalInvestmentProfit = userData.investments
              .filter(inv => inv.status === 'completed' && inv.amount && inv.expectedReturn)
              .reduce((total, inv) => total + (inv.expectedReturn - inv.amount), 0);
          }

          if (Array.isArray(userData.transactions)) {
            totalBonusProfit = userData.transactions
              .filter(t => t.status === 'approved' && t.bonus)
              .reduce((total, t) => total + (t.bonus || 0), 0);
          }

          setTotalProfit(totalInvestmentProfit + totalBonusProfit);
        }

        // Calculate profit change
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        let lastMonthProfit = 0;

        if (Array.isArray(userData.transactions)) {
          userData.transactions
            .filter(t => t.status === 'approved' && new Date(t.timestamp) > lastMonth)
            .forEach(transaction => {
              if (transaction.type === 'withdrawal') {
                lastMonthProfit -= transaction.amount;
              } else if (transaction.bonus) {
                lastMonthProfit += transaction.bonus;
              }
            });
        }

        if (lastMonthProfit !== 0) {
          const profitChangePercent = ((totalProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100;
          setProfitChange(Math.round(profitChangePercent * 10) / 10);
        } else {
          setProfitChange(0);
        }

      } catch (error) {
        console.error("Error calculating stats:", error);
        toast({
          title: "Error",
          description: "Failed to calculate statistics",
          variant: "destructive",
        });
      }
    };

    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setUserData(data);
            calculateStats(data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to fetch user data",
            variant: "destructive",
          });
        }
      }
    };

    fetchUserData();
  }, [user, toast]);

  const handleCopyReferralCode = () => {
    if (userData?.myReferralCode) {
      navigator.clipboard.writeText(userData.myReferralCode);
      toast({
        title: translate("Referral code copied!"),
        description: translate("Share this code with your friends to earn bonuses"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Dashboard")}</h2>
      
      {/* Referral Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{translate("Your Referral Code")}</h3>
              <div className="flex items-center gap-2">
                <code className="bg-white/20 px-4 py-2 rounded-md font-mono text-lg">
                  {userData?.myReferralCode || translate('Loading...')}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyReferralCode}
                  className="whitespace-nowrap"
                  disabled={!userData?.myReferralCode}
                >
                  {translate("Copy Code")}
                </Button>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-blue-100">{translate("Total Referrals")}</p>
                <p className="text-2xl font-bold">{userData?.referralCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100">{translate("Referral Earnings")}</p>
                <p className="text-2xl font-bold">{formatNumber.format(userData?.totalReferralBonus || 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Total Balance")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber.format(userData?.balance || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Total Deposits")}</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber.format(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">
              {translate("All time deposits")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Active Investments")}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.investments?.filter(inv => inv.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {translate("Active investment plans")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Total Profit")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatNumber.format(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {profitChange > 0 ? '+' : ''}{profitChange}% {translate("from last month")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Referral Network")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.referralCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {translate("Active referrals")}
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-4">{translate("Active Investments")}</h3>
      <div className="grid gap-4">
        {userData?.investments?.filter(inv => inv.status === 'active').map((investment) => (
          <Card key={investment.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-semibold">{translate("Investment")} #{investment.id}</h4>
                  <p className="text-sm text-muted-foreground">
                    {translate("Started")} {formatDate.format(new Date(investment.startDate))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatNumber.format(investment.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {translate("Expected")}: {formatNumber.format(investment.expectedReturn)}
                  </p>
                </div>
              </div>
              <Progress value={investment.progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-right">
                {investment.progress}% {translate("Complete")}
              </p>
            </CardContent>
          </Card>
        ))}
        {(!userData?.investments || userData.investments.filter(inv => inv.status === 'active').length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            {translate("No active investments")}
          </div>
        )}
      </div>
    </div>
  );
}