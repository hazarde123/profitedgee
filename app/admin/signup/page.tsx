"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Admin registration code - should be kept secret and managed securely in production
const ADMIN_REGISTRATION_CODE = "ADMIN_SECRET_2024";

export default function AdminSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registrationCode !== ADMIN_REGISTRATION_CODE) {
      toast({
        title: "Invalid Code",
        description: "The admin registration code is incorrect",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create admin profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "admin",
        createdAt: new Date().toISOString(),
        kycStatus: "verified"
      });

      toast({
        title: "Success",
        description: "Admin account created successfully",
      });

      router.push("/dashboard/admin");
    } catch (error: any) {
      let errorMessage = "Failed to create admin account";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak";
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
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Create Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationCode">Admin Registration Code</Label>
              <Input
                id="registrationCode"
                type="password"
                placeholder="Enter admin registration code"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating admin account...
                </>
              ) : (
                "Create Admin Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}