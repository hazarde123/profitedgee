"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/translation";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  walletAddress?: string;
  paymentMethod: string;
  timestamp: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date>();
  const { translate } = useTranslation();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const transactionsData: Transaction[] = [];
        
        querySnapshot.forEach((doc) => {
          transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.amount.toString().includes(searchQuery)
      );
    }

    // Apply date filter
    if (date) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return (
          transactionDate.getDate() === date.getDate() &&
          transactionDate.getMonth() === date.getMonth() &&
          transactionDate.getFullYear() === date.getFullYear()
        );
      });
    }

    setFilteredTransactions(filtered);
  }, [typeFilter, statusFilter, searchQuery, date, transactions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const exportToCSV = () => {
    const headers = [
      translate("Date"),
      translate("Type"),
      translate("Amount"),
      translate("Status"),
      translate("Payment Method"),
      translate("Wallet Address")
    ];
    const csvData = filteredTransactions.map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      t.type,
      t.amount,
      t.status,
      t.paymentMethod,
      t.walletAddress || translate("N/A")
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">{translate("Transaction History")}</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {translate("Export CSV")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{translate("All Transactions")}</CardTitle>
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{translate("Filters")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={translate("Filter by type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translate("All Types")}</SelectItem>
                    <SelectItem value="deposit">{translate("Deposits")}</SelectItem>
                    <SelectItem value="withdrawal">{translate("Withdrawals")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={translate("Filter by status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translate("All Status")}</SelectItem>
                    <SelectItem value="pending">{translate("Pending")}</SelectItem>
                    <SelectItem value="approved">{translate("Approved")}</SelectItem>
                    <SelectItem value="rejected">{translate("Rejected")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={translate("Search transactions...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : translate("Pick a date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce"></div>
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {translate("No transactions found")}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translate("Date")}</TableHead>
                      <TableHead>{translate("Type")}</TableHead>
                      <TableHead>{translate("Amount")}</TableHead>
                      <TableHead>{translate("Payment Method")}</TableHead>
                      <TableHead>{translate("Status")}</TableHead>
                      <TableHead>{translate("Wallet Address")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.timestamp), "PPP")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                            {translate(transaction.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(
                          "font-medium",
                          transaction.type === 'deposit' ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                        </TableCell>
                        <TableCell>{translate(transaction.paymentMethod)}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'pending' ? 'secondary' :
                                        transaction.status === 'approved' ? 'default' :
                                        transaction.status === 'rejected' ? 'destructive' : 'outline'}>
                            {translate(transaction.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[200px] truncate">
                          {transaction.walletAddress || translate('N/A')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}