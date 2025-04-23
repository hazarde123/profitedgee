"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { Users, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/lib/translation";

interface Analytics {
  totalUsers: number;
  activeInvestments: number;
  totalDeposits: number;
  totalWithdrawals: number;
  dailyTransactions: any[];
  investmentDistribution: any[];
  userGrowth: any[];
  recentTransactions: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    activeInvestments: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    dailyTransactions: [],
    investmentDistribution: [],
    userGrowth: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const { translate } = useTranslation();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch users
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;

        // Fetch transactions for the last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const transactionsRef = collection(db, "transactions");
        const transactionsQuery = query(
          transactionsRef,
          where("timestamp", ">=", thirtyDaysAgo.toISOString()),
          orderBy("timestamp", "desc")
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);

        // Process transactions
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        const dailyTransactions: { [key: string]: { deposits: number; withdrawals: number } } = {};
        
        transactionsSnapshot.forEach(doc => {
          const transaction = doc.data();
          const date = format(new Date(transaction.timestamp), 'MMM dd');
          
          if (!dailyTransactions[date]) {
            dailyTransactions[date] = { deposits: 0, withdrawals: 0 };
          }

          if (transaction.type === 'deposit' && transaction.status === 'approved') {
            totalDeposits += transaction.amount;
            dailyTransactions[date].deposits += transaction.amount;
          } else if (transaction.type === 'withdrawal' && transaction.status === 'approved') {
            totalWithdrawals += transaction.amount;
            dailyTransactions[date].withdrawals += transaction.amount;
          }
        });

        // Calculate investment distribution
        const investmentDistribution = [
          { name: 'Starter Plan', value: 0 },
          { name: 'Growth Plan', value: 0 },
          { name: 'Premium Plan', value: 0 }
        ];

        let activeInvestments = 0;
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.investments) {
            userData.investments.forEach((investment: any) => {
              if (investment.status === 'active') {
                activeInvestments++;
                if (investment.amount <= 1000) {
                  investmentDistribution[0].value++;
                } else if (investment.amount <= 5000) {
                  investmentDistribution[1].value++;
                } else {
                  investmentDistribution[2].value++;
                }
              }
            });
          }
        });

        // Format data for charts
        const dailyTransactionsData = Object.entries(dailyTransactions).map(([date, data]) => ({
          date,
          deposits: data.deposits,
          withdrawals: data.withdrawals
        }));

        setAnalytics({
          totalUsers,
          activeInvestments,
          totalDeposits,
          totalWithdrawals,
          dailyTransactions: dailyTransactionsData,
          investmentDistribution,
          userGrowth: [], // Implement if needed
          recentTransactions: transactionsSnapshot.docs.slice(0, 5).map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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
      <h2 className="text-3xl font-bold tracking-tight">{translate("Analytics Dashboard")}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Total Users")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {translate("Registered users")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Active Investments")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeInvestments}</div>
            <p className="text-xs text-muted-foreground">
              {translate("Current active plans")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Total Deposits")}</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${analytics.totalDeposits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {translate("All time deposits")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate("Total Withdrawals")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${analytics.totalWithdrawals.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {translate("All time withdrawals")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{translate("Daily Transactions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyTransactions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="deposits" 
                    stroke="#22c55e" 
                    name={translate("Deposits")}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="withdrawals" 
                    stroke="#ef4444" 
                    name={translate("Withdrawals")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate("Investment Distribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.investmentDistribution.map(item => ({
                      ...item,
                      name: translate(item.name)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.investmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}