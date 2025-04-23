"use client";

import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useTranslation } from "@/lib/translation";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { 
  Bitcoin, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  User, 
  Wallet,
  TrendingUp,
  History,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  BarChart,
  Users,
  FileText,
  Bell,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/notification-bell";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentLanguage, setCurrentLanguage, translate } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const userMenuItems = [
    {
      title: translate("Overview"),
      items: [
        {
          name: translate("Dashboard"),
          icon: LayoutDashboard,
          href: "/dashboard"
        },
        {
          name: translate("Wallet"),
          icon: Wallet,
          href: "/dashboard/wallet"
        }
      ]
    },
    {
      title: translate("Investments"),
      items: [
        {
          name: translate("Investment Plans"),
          icon: TrendingUp,
          href: "/dashboard/invest"
        },
        {
          name: translate("Transaction History"),
          icon: History,
          href: "/dashboard/transactions"
        }
      ]
    },
    {
      title: translate("Account"),
      items: [
        {
          name: translate("KYC Verification"),
          icon: ShieldCheck,
          href: "/dashboard/settings"
        },
        {
          name: translate("Support"),
          icon: MessageSquare,
          href: "/dashboard/support"
        }
      ]
    }
  ];

  const adminMenuItems = [
    {
      title: translate("Overview"),
      items: [
        {
          name: translate("Dashboard"),
          icon: LayoutDashboard,
          href: "/dashboard/admin"
        },
        {
          name: translate("Analytics"),
          icon: BarChart,
          href: "/dashboard/admin/analytics"
        }
      ]
    },
    {
      title: translate("Management"),
      items: [
        {
          name: translate("Users"),
          icon: Users,
          href: "/dashboard/admin/users"
        },
        {
          name: translate("KYC Requests"),
          icon: FileText,
          href: "/dashboard/admin/kyc"
        },
        {
          name: translate("Support Tickets"),
          icon: MessageSquare,
          href: "/dashboard/admin/support"
        }
      ]
    },
    {
      title: translate("Settings"),
      items: [
        {
          name: translate("Notifications"),
          icon: Bell,
          href: "/dashboard/admin/notifications"
        },
        {
          name: translate("System Settings"),
          icon: Settings,
          href: "/dashboard/admin/settings"
        }
      ]
    }
  ];

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!loading) {
          if (!user) {
            if (pathname !== '/login') {
              sessionStorage.setItem('redirectAfterLogin', pathname);
            }
            router.replace("/login");
            return;
          }
          
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            console.error("User document not found");
            await auth.signOut();
            router.replace("/login");
            return;
          }
          
          const isUserAdmin = docSnap.data()?.role === "admin";
          setIsAdmin(isUserAdmin);

          // Redirect non-admin users trying to access admin routes
          if (!isUserAdmin && pathname.startsWith('/dashboard/admin')) {
            router.replace("/dashboard");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/login");
      }
    };

    checkAuth();
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('redirectAfterLogin');
      await auth.signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <Bitcoin className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-blue-600">Profitedge</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector 
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
              />
              {!isAdmin && <NotificationBell />}
              {isAdmin && (
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
                  <User className="h-5 w-5" />
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">{translate("Logout")}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="h-16 flex items-center justify-center lg:hidden">
            <Bitcoin className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-blue-600">Profitedge</span>
          </div>

          <nav className="p-4 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
            {menuItems.map((section) => (
              <div key={section.title} className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                  {section.title}
                </h2>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}