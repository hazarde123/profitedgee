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
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { useTranslation } from "@/lib/translation";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { ArrowDownLeft, ArrowUpRight, Wallet, Bitcoin, CreditCard, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  walletAddress?: string;
  paymentMethod: string;
  timestamp: string;
}

interface UserData {
  hasFirstDeposit: boolean;
  balance: number;
}

const DEPOSIT_BTC_ADDRESS = "bc1qyn0xh97032gntyjlk0hd9ucu6vzka3va88feju";
const FIRST_DEPOSIT_BONUS = 0.3; // 30% bonus

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bitcoin");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasFirstDeposit, setHasFirstDeposit] = useState(false);
  const { toast } = useToast();
  const { translate } = useTranslation();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserData;
          setBalance(userData.balance);
          setHasFirstDeposit(userData.hasFirstDeposit || false);
          // Fetch transactions
          const transactionsRef = collection(db, "users", auth.currentUser.uid, "transactions");
          const transactionsSnap = await getDoc(doc(transactionsRef, "list"));
          if (transactionsSnap.exists()) {
            setTransactions(transactionsSnap.data().items || []);
          }
        }
      }
    };

    fetchUserData();
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_BTC_ADDRESS);
    toast({
      title: translate("Address copied"),
      description: translate("Bitcoin address has been copied to clipboard"),
    });
  };

  const handleTransaction = async (type: "deposit" | "withdraw") => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: translate("Invalid amount"),
        description: translate("Please enter a valid amount"),
        variant: "destructive",
      });
      return;
    }

    if (type === "withdraw" && !walletAddress) {
      toast({
        title: translate("Missing wallet address"),
        description: translate("Please enter your Bitcoin wallet address"),
        variant: "destructive",
      });
      return;
    }

    const numAmount = Number(amount);

    if (type === "withdraw" && numAmount > balance) {
      toast({
        title: translate("Insufficient funds"),
        description: translate("You don't have enough balance for this withdrawal"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate bonus for first deposit
      const bonus = !hasFirstDeposit && type === "deposit" ? numAmount * FIRST_DEPOSIT_BONUS : 0;
      
      // Create transaction request
      const transaction = {
        type: type === "withdraw" ? "withdrawal" : "deposit",
        amount: numAmount,
        bonus: bonus,
        status: "pending",
        walletAddress: type === "withdraw" ? walletAddress : DEPOSIT_BTC_ADDRESS,
        paymentMethod: "bitcoin",
        timestamp: new Date().toISOString(),
        userId: auth.currentUser!.uid,
        userEmail: auth.currentUser!.email
      };

      // Add to transactions collection
      await addDoc(collection(db, "transactions"), transaction);

      // Update user's first deposit status if this is their first deposit
      if (!hasFirstDeposit && type === "deposit") {
        await updateDoc(doc(db, "users", auth.currentUser!.uid), {
          hasFirstDeposit: true
        });
        setHasFirstDeposit(true);
      }

      setAmount("");
      if (type === "withdraw") setWalletAddress("");

      const bonusMessage = bonus > 0 ? translate(` You'll receive a ${FIRST_DEPOSIT_BONUS * 100}% bonus (${bonus} USD) on approval!`) : "";
      
      toast({
        title: translate(`${type === "deposit" ? "Deposit" : "Withdrawal"} request submitted`),
        description: translate(`Your request is pending admin approval.`) + bonusMessage,
      });
    } catch (error) {
      toast({
        title: translate("Error"),
        description: translate("Transaction request failed. Please try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{translate("Wallet")}</h2>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{translate("Available Balance")}</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${balance}</div>
          {!hasFirstDeposit && (
            <p className="text-sm text-green-600 mt-2">
              {translate(`Get ${FIRST_DEPOSIT_BONUS * 100}% bonus on your first deposit!`)}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              {translate("Deposit")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translate("Deposit Funds")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{translate("Bitcoin Deposit Address")}</Label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded-md font-mono text-sm">
                    {DEPOSIT_BTC_ADDRESS}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {translate("Send your Bitcoin to this address. The deposit will be credited after confirmation.")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{translate("Amount (USD)")}</Label>
                <Input
                  type="number"
                  placeholder={translate("Enter amount")}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handleTransaction("deposit")}
              >
                {translate("Submit Deposit Request")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline" size="lg">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {translate("Withdraw")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translate("Withdraw Funds")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{translate("Amount (USD)")}</Label>
                <Input
                  type="number"
                  placeholder={translate("Enter amount")}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{translate("Your Bitcoin Wallet Address")}</Label>
                <Input
                  placeholder={translate("Enter your Bitcoin wallet address")}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {translate("Make sure to double-check your wallet address")}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => handleTransaction("withdraw")}
              >
                {translate("Submit Withdrawal Request")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("Recent Transactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {translate(transaction.type === "deposit" ? "Deposit" : "Withdrawal")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "deposit" ? "+" : "-"}${transaction.amount}
                  </p>
                  <p className={`text-sm ${
                    transaction.status === "approved"
                      ? "text-green-600"
                      : transaction.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}>
                    {translate(transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}