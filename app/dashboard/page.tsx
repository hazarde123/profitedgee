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
import { withPageTranslation } from "@/components/withPageTranslation";
import { useTranslation } from "@/lib/translation";

const defaultContent = {
  dashboard: "Dashboard",
  referralCode: "Your Referral Code",
  loading: "Loading...",
  copyCode: "Copy Code",
  totalReferrals: "Total Referrals",
  referralEarnings: "Referral Earnings",
  totalBalance: "Total Balance",
  totalDeposits: "Total Deposits",
  allTimeDeposits: "All time deposits",
  activeInvestments: "Active Investments",
  activeInvestmentPlans: "Active investment plans",
  totalProfit: "Total Profit",
  fromLastMonth: "from last month",
  referralNetwork: "Referral Network",
  activeReferrals: "Active referrals",
  investment: "Investment",
  started: "Started",
  expected: "Expected",
  complete: "Complete",
  noActiveInvestments: "No active investments",
  referralCopied: "Referral code copied!",
  shareCode: "Share this code with your friends to earn bonuses"
};

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

function DashboardPage({ ...translations }: typeof defaultContent) {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const [profitChange, setProfitChange] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const { toast } = useToast();
  const { currentLanguage } = useTranslation();

  // Format numbers according to current language locale
  const formatNumber = useMemo(() => {
    const localeMap: { [key: string]: string } = {
      'EN': 'en-US',
      'ES': 'es-ES',
      'FR': 'fr-FR',
      'DE': 'de-DE',
      'IT': 'it-IT',
      'PT': 'pt-PT',
      'RU': 'ru-RU',
      'ZH': 'zh-CN',
      'JA': 'ja-JP',
      'KO': 'ko-KR',
      'AR': 'ar-SA'
    };
    
    const locale = localeMap[currentLanguage] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    });
  }, [currentLanguage]);

  // Format dates according to current language locale
  const formatDate = useMemo(() => {
    const localeMap: { [key: string]: string } = {
      'EN': 'en-US',
      'ES': 'es-ES',
      'FR': 'fr-FR',
      'DE': 'de-DE',
      'IT': 'it-IT',
      'PT': 'pt-PT',
      'RU': 'ru-RU',
      'ZH': 'zh-CN',
      'JA': 'ja-JP',
      'KO': 'ko-KR',
      'AR': 'ar-SA'
    };
    
    const locale = localeMap[currentLanguage] || 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        title: translations.referralCopied,
        description: translations.shareCode,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translations.dashboard}</h2>
      
      {/* Referral Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{translations.referralCode}</h3>
              <div className="flex items-center gap-2">
                <code className="bg-white/20 px-4 py-2 rounded-md font-mono text-lg">
                  {userData?.myReferralCode || translations.loading}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyReferralCode}
                  className="whitespace-nowrap"
                  disabled={!userData?.myReferralCode}
                >
                  {translations.copyCode}
                </Button>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-blue-100">{translations.totalReferrals}</p>
                <p className="text-2xl font-bold">{userData?.referralCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100">{translations.referralEarnings}</p>
                <p className="text-2xl font-bold">{formatNumber.format(userData?.totalReferralBonus || 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.totalBalance}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber.format(userData?.balance || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.totalDeposits}</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber.format(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">
              {translations.allTimeDeposits}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.activeInvestments}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.investments?.filter(inv => inv.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {translations.activeInvestmentPlans}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.totalProfit}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatNumber.format(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {profitChange > 0 ? '+' : ''}{profitChange}% {translations.fromLastMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.referralNetwork}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.referralCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {translations.activeReferrals}
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-4">{translations.activeInvestments}</h3>
      <div className="grid gap-4">
        {userData?.investments?.filter(inv => inv.status === 'active').map((investment) => (
          <Card key={investment.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-semibold">{translations.investment} #{investment.id}</h4>
                  <p className="text-sm text-muted-foreground">
                    {translations.started} {formatDate.format(new Date(investment.startDate))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatNumber.format(investment.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {translations.expected}: {formatNumber.format(investment.expectedReturn)}
                  </p>
                </div>
              </div>
              <Progress value={investment.progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-right">
                {investment.progress}% {translations.complete}
              </p>
            </CardContent>
          </Card>
        ))}
        {(!userData?.investments || userData.investments.filter(inv => inv.status === 'active').length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            {translations.noActiveInvestments}
          </div>
        )}
      </div>
    </div>
  );
}

export default withPageTranslation(DashboardPage, defaultContent);