"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, query, getDocs, where, collection } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Function to generate a random referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const REFERRAL_BONUS = 100; // Bonus amount in USD

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const validateForm = () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check referral code if provided
      let referrerDoc;
      if (referralCode) {
        // Query for the referral code
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("myReferralCode", "==", referralCode));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast({
            title: "Invalid referral code",
            description: "The referral code you entered is not valid",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        referrerDoc = querySnapshot.docs[0];
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate unique referral code for new user
      const newReferralCode = generateReferralCode();

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user",
        balance: referralCode ? REFERRAL_BONUS : 0, // Give bonus if referred
        myReferralCode: newReferralCode, // User's own referral code
        referredBy: referralCode || null, // Store who referred this user
        referralCount: 0, // Number of people this user has referred
        totalReferralBonus: 0, // Total earnings from referrals
        referrals: [], // Array of referred user IDs
        createdAt: new Date().toISOString(),
        investments: [],
        kycStatus: "pending"
      });

      // If user was referred, update referrer's data
      if (referrerDoc) {
        const referrerId = referrerDoc.id;
        const referrerData = referrerDoc.data();
        
        await updateDoc(doc(db, "users", referrerId), {
          balance: (referrerData.balance || 0) + REFERRAL_BONUS,
          referralCount: (referrerData.referralCount || 0) + 1,
          totalReferralBonus: (referrerData.totalReferralBonus || 0) + REFERRAL_BONUS,
          referrals: arrayUnion(user.uid)
        });
      }

      let successMessage = referralCode
        ? `Account created successfully! You and your referrer each received a $${REFERRAL_BONUS} bonus!`
        : "Account created successfully!";

      toast({
        title: "Success!",
        description: successMessage,
      });

      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "An error occurred during signup";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please try logging in.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password sign up is not enabled. Please contact support.";
          break;
        case 'auth/weak-password':
          errorMessage = "Please choose a stronger password (at least 6 characters).";
          break;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                className="lowercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">
                Referral Code{" "}
                <span className="text-sm text-muted-foreground">
                  (Get ${REFERRAL_BONUS} bonus!)
                </span>
              </Label>
              <Input
                id="referral"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.trim().toUpperCase())}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}