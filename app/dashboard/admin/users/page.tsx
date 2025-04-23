"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { db, auth } from "@/lib/firebase";
import { collection, query, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Search, Shield, UserX, Plus, Minus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  email: string;
  role: string;
  balance: number;
  totalProfit: number;
  totalDeposits: number;
  kycStatus: string;
  createdAt: string;
  referralCount: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [isProfitAdjustment, setIsProfitAdjustment] = useState(false);
  const [isDepositAdjustment, setIsDepositAdjustment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        const usersData: User[] = [];
        
        querySnapshot.forEach((doc) => {
          usersData.push({ 
            id: doc.id, 
            ...doc.data(),
            totalProfit: doc.data().totalProfit || 0,
            totalDeposits: doc.data().totalDeposits || 0
          } as User);
        });
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const handleAdjustment = async () => {
    if (!selectedUser || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const adjustmentAmount = adjustmentType === "add" ? Number(amount) : -Number(amount);
      const field = isProfitAdjustment ? "totalProfit" : isDepositAdjustment ? "totalDeposits" : "balance";
      const currentValue = selectedUser[field] || 0;
      const newValue = currentValue + adjustmentAmount;

      // Update user's value in Firestore
      await updateDoc(doc(db, "users", selectedUser.id), {
        [field]: newValue
      });

      // Create an adjustment record
      await addDoc(collection(db, "adjustments"), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        amount: adjustmentAmount,
        type: adjustmentType,
        field: isProfitAdjustment ? "profit" : isDepositAdjustment ? "deposits" : "balance",
        note: adjustmentNote,
        timestamp: new Date().toISOString(),
        adminId: auth.currentUser?.uid
      });

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, [field]: newValue }
          : user
      );
      setUsers(updatedUsers);

      toast({
        title: "Success",
        description: `${isProfitAdjustment ? "Profit" : isDepositAdjustment ? "Deposits" : "Balance"} ${adjustmentType === "add" ? "added to" : "subtracted from"} user's account`,
      });

      // Reset form
      setAmount("");
      setAdjustmentNote("");
      setSelectedUser(null);
      setIsProfitAdjustment(false);
      setIsDepositAdjustment(false);
    } catch (error) {
      console.error("Adjustment error:", error);
      toast({
        title: "Error",
        description: `Failed to adjust ${isProfitAdjustment ? "profit" : isDepositAdjustment ? "deposits" : "balance"}`,
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "banned"
      });
      
      toast({
        title: "Success",
        description: "User has been banned",
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: "banned" }
          : user
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "admin"
      });
      
      toast({
        title: "Success",
        description: "User has been made admin",
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: "admin" }
          : user
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">User Management</h2>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
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
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Total Profit</TableHead>
                    <TableHead>Total Deposits</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>${user.balance}</span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsProfitAdjustment(false);
                                  setIsDepositAdjustment(false);
                                }}
                              >
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Balance for {user.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-center space-x-4">
                                  <Button
                                    variant={adjustmentType === "add" ? "default" : "outline"}
                                    onClick={() => setAdjustmentType("add")}
                                    className="flex-1"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                  </Button>
                                  <Button
                                    variant={adjustmentType === "subtract" ? "default" : "outline"}
                                    onClick={() => setAdjustmentType("subtract")}
                                    className="flex-1"
                                  >
                                    <Minus className="mr-2 h-4 w-4" />
                                    Subtract
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label>Amount (USD)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Note (Optional)</Label>
                                  <Input
                                    placeholder="Enter reason for adjustment"
                                    value={adjustmentNote}
                                    onChange={(e) => setAdjustmentNote(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={handleAdjustment}
                                >
                                  Confirm Adjustment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>${user.totalProfit || 0}</span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsProfitAdjustment(true);
                                  setIsDepositAdjustment(false);
                                }}
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Total Profit for {user.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-center space-x-4">
                                  <Button
                                    variant={adjustmentType === "add" ? "default" : "outline"}
                                    onClick={() => setAdjustmentType("add")}
                                    className="flex-1"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                  </Button>
                                  <Button
                                    variant={adjustmentType === "subtract" ? "default" : "outline"}
                                    onClick={() => setAdjustmentType("subtract")}
                                    className="flex-1"
                                  >
                                    <Minus className="mr-2 h-4 w-4" />
                                    Subtract
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label>Amount (USD)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Note (Optional)</Label>
                                  <Input
                                    placeholder="Enter reason for adjustment"
                                    value={adjustmentNote}
                                    onChange={(e) => setAdjustmentNote(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={handleAdjustment}
                                >
                                  Confirm Profit Adjustment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>${user.totalDeposits || 0}</span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDepositAdjustment(true);
                                  setIsProfitAdjustment(false);
                                }}
                              >
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Total Deposits for {user.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-center space-x-4">
                                  <Button
                                    variant={adjustmentType === "add" ? "default" : "outline"}
                                    onClick={() => setAdjustmentType("add")}
                                    className="flex-1"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                  </Button>
                                  <Button
                                    variant={adjustmentType === "subtract" ? "default" : "outline"}
                                    onClick={() => setAdjustmentType("subtract")}
                                    className="flex-1"
                                  >
                                    <Minus className="mr-2 h-4 w-4" />
                                    Subtract
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label>Amount (USD)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Note (Optional)</Label>
                                  <Input
                                    placeholder="Enter reason for adjustment"
                                    value={adjustmentNote}
                                    onChange={(e) => setAdjustmentNote(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={handleAdjustment}
                                >
                                  Confirm Deposit Adjustment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.kycStatus === "verified" 
                            ? "default" 
                            : user.kycStatus === "pending"
                            ? "secondary"
                            : "destructive"
                        }>
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.referralCount}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user.role !== "admin" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakeAdmin(user.id)}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBanUser(user.id)}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            </>
                          )}
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