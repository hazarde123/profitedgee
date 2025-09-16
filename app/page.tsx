"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSelector } from "@/components/ui/language-selector";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight, Bitcoin, Shield, TrendingUp, DollarSign, CheckCircle2, HelpCircle, Mail, Phone, MapPin, ExternalLink, ChevronRight, Quote, Coins, CircleDollarSign, Gem, Waves, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/translation";

const CRYPTO_PAIRS = [
  { id: "bitcoin", symbol: "BTC/USD", name: "Bitcoin", icon: Bitcoin },
  { id: "ethereum", symbol: "ETH/USD", name: "Ethereum", icon: Coins },
  { id: "binancecoin", symbol: "BNB/USD", name: "Binance", icon: CircleDollarSign },
  { id: "solana", symbol: "SOL/USD", name: "Solana", icon: Gem },
  { id: "ripple", symbol: "XRP/USD", name: "Ripple", icon: Waves },
];

const INVESTMENT_PLANS = [
  {
    name: "Starter Plan",
    description: "Perfect for beginners looking to enter the crypto market",
    price: "$1,000",
    dailyReturn: "25% Daily",
    duration: "5 days",
    referralBonus: "2%",
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
    name: "Growth Plan",
    description: "Ideal for investors seeking substantial growth",
    price: "$5,000",
    dailyReturn: "30% Daily",
    duration: "14 days",
    referralBonus: "5%",
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
    name: "Premium Plan",
    description: "For serious investors seeking maximum returns",
    price: "$10,000",
    dailyReturn: "45% Daily",
    duration: "21 days",
    referralBonus: "8%",
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

const STEPS = [
  {
    title: "Create Account",
    description: "Sign up in minutes with just your email and password"
  },
  {
    title: "Verify Identity",
    description: "Complete our simple KYC process to secure your account"
  },
  {
    title: "Fund Account",
    description: "Deposit funds using Bitcoin or other supported methods"
  },
  {
    title: "Start Investing",
    description: "Choose your investment plan and start earning returns"
  }
];

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Small Business Owner",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=80",
    content: "Profitedge has transformed how I invest in cryptocurrency. The platform is intuitive, and the returns have been consistently impressive. Their customer support is exceptional!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Tech Entrepreneur",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&auto=format&fit=crop&q=80",
    content: "As someone who's been in crypto for years, I'm impressed by Profitedge's professional approach. Their investment strategies are solid, and the platform's security gives me peace of mind.",
    rating: 5
  },
  {
    name: "Emma Davis",
    role: "Financial Analyst",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&auto=format&fit=crop&q=80",
    content: "The returns on my investments have exceeded my expectations. Profitedge's transparent approach and regular updates keep me confident in my investment decisions.",
    rating: 5
  },
  {
    name: "David Wilson",
    role: "Retired Investor",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&auto=format&fit=crop&q=80",
    content: "I appreciate how Profitedge makes crypto investing accessible to everyone. Their starter plan was perfect for testing the waters, and now I'm a committed premium investor.",
    rating: 5
  },
  {
    name: "Jennifer Lee",
    role: "Investment Advisor",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&auto=format&fit=crop&q=80",
    content: "The platform's referral system is fantastic! I've recommended it to several clients, and everyone has been thrilled with the results and professional service.",
    rating: 5
  },
  {
    name: "Robert Martinez",
    role: "Crypto Trader",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&auto=format&fit=crop&q=80",
    content: "The Premium Plan's returns are outstanding. The expert consultation has helped me make informed decisions, and the VIP support is always there when I need it.",
    rating: 5
  },
  {
    name: "Lisa Thompson",
    role: "Digital Marketing Director",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&auto=format&fit=crop&q=80",
    content: "Started with the Growth Plan and haven't looked back. The daily returns are consistent, and the platform's transparency is refreshing in the crypto space.",
    rating: 5
  },
  {
    name: "James Anderson",
    role: "Portfolio Manager",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&auto=format&fit=crop&q=80",
    content: "The real-time tracking and advanced analytics have made managing my crypto investments effortless. Profitedge's security measures are top-notch.",
    rating: 5
  },
  {
    name: "Alexandra Wright",
    role: "Startup Founder",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&auto=format&fit=crop&q=80",
    content: "The Growth Plan exceeded all my expectations. The daily returns have been phenomenal, and the platform's user interface makes tracking investments a breeze.",
    rating: 5
  },
  {
    name: "Marcus Johnson",
    role: "Real Estate Developer",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&auto=format&fit=crop&q=80",
    content: "After trying several crypto investment platforms, Profitedge stands out for its reliability and consistent performance. The referral program is an excellent bonus!",
    rating: 5
  },
  {
    name: "Sophie Chen",
    role: "E-commerce Entrepreneur",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=80",
    content: "What impresses me most is the platform's commitment to security and transparency. The KYC process was smooth, and the support team is always responsive.",
    rating: 5
  },
  {
    name: "Thomas Baker",
    role: "Investment Banker",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=80",
    content: "The Premium Plan's performance has been remarkable. The platform's professional approach to crypto investing sets it apart from others in the market.",
    rating: 5
  }
];

interface CryptoPrice {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
}

function CryptoTicker() {
  const [prices, setPrices] = useState<{[key: string]: CryptoPrice}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = CRYPTO_PAIRS.map(pair => pair.id).join(",");
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        
        const formattedPrices: {[key: string]: CryptoPrice} = {};
        Object.entries(data).forEach(([id, priceData]: [string, any]) => {
          formattedPrices[id] = {
            id,
            current_price: priceData.usd,
            price_change_percentage_24h: priceData.usd_24h_change || 0
          };
        });
        
        setPrices(formattedPrices);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    // Initial fetch
    fetchPrices();

    // Fetch every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Create duplicate items for infinite scroll effect
  const tickerItems = [...CRYPTO_PAIRS, ...CRYPTO_PAIRS];

  return (
    <div className="w-full bg-gray-900 text-white py-2 overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
          </div>
        </div>
      ) : (
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex">
            {tickerItems.map((pair, index) => {
              const price = prices[pair.id];
              const Icon = pair.icon;
              
              return (
                <div key={`${pair.id}-${index}`} className="flex items-center space-x-2 mx-4">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{pair.name}</span>
                  <span>
                    ${price?.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <span className={price?.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"}>
                    {price?.price_change_percentage_24h >= 0 ? "+" : ""}
                    {price?.price_change_percentage_24h.toFixed(2)}%
                  </span>
                  {index < tickerItems.length - 1 && <span className="mx-2">|</span>}
                </div>
              );
            })}
          </div>
          <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex">
            {tickerItems.map((pair, index) => {
              const price = prices[pair.id];
              const Icon = pair.icon;
              
              return (
                <div key={`${pair.id}-${index}-clone`} className="flex items-center space-x-2 mx-4">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{pair.name}</span>
                  <span>
                    ${price?.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <span className={price?.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"}>
                    {price?.price_change_percentage_24h >= 0 ? "+" : ""}
                    {price?.price_change_percentage_24h.toFixed(2)}%
                  </span>
                  {index < tickerItems.length - 1 && <span className="mx-2">|</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { currentLanguage, setCurrentLanguage, translate } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [translatedContent, setTranslatedContent] = useState({
    hero: {
      title: translate("Your Gateway to Smart Crypto Investments"),
      subtitle: translate("Join thousands of investors earning consistent returns through our expertly managed crypto investment platform. Get started with as little as $100."),
    },
    buttons: {
      startInvesting: translate("Start Investing"),
      learnMore: translate("Learn More"),
    },
    features: {
      security: translate("Bank-grade Security"),
      track: translate("Proven Track Record"),
      roi: translate("High ROI"),
    }
  });

  useEffect(() => {
    // Update translations when language changes
    setTranslatedContent({
      hero: {
        title: translate("Your Gateway to Smart Crypto Investments"),
        subtitle: translate("Join thousands of investors earning consistent returns through our expertly managed crypto investment platform. Get started with as little as $100."),
      },
      buttons: {
        startInvesting: translate("Start Investing"),
        learnMore: translate("Learn More"),
      },
      features: {
        security: translate("Bank-grade Security"),
        track: translate("Proven Track Record"),
        roi: translate("High ROI"),
      }
    });
  }, [currentLanguage, translate]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bitcoin className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">Profitedge</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-gray-600 hover:text-blue-600">{translate("About")}</a>
            <a href="#plans" className="text-gray-600 hover:text-blue-600">{translate("Plans")}</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600">{translate("How It Works")}</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600">{translate("Contact")}</a>
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">{translate("Login")}</Button>
              </Link>
              <Link href="/signup">
                <Button>{translate("Sign Up")}</Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-4">
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
            <Button variant="ghost" size="sm" className="p-2" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 pt-2 pb-3 space-y-1">
          <a href="#about" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600">{translate("About")}</a>
          <a href="#plans" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600">{translate("Plans")}</a>
          <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600">{translate("How It Works")}</a>
          <a href="#contact" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600">{translate("Contact")}</a>
          <div className="flex space-x-4 px-3 py-2">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">{translate("Login")}</Button>
            </Link>
            <Link href="/signup" className="w-full">
              <Button className="w-full">{translate("Sign Up")}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Crypto Ticker */}
      <CryptoTicker />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            {translatedContent.hero.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {translatedContent.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                {translatedContent.buttons.startInvesting} <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {translatedContent.buttons.learnMore} <ChevronRight className="ml-2" />
              </Button>
            </a>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-lg">{translatedContent.features.security}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="text-lg">{translatedContent.features.track}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <span className="text-lg">{translatedContent.features.roi}</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white dark:bg-gray-800 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{translate("Why Choose Profitedge?")}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {translate("We combine years of crypto market expertise with cutting-edge technology to deliver consistent returns for our investors.")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">{translate("Secure Platform")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {translate("Your investments are protected with military-grade encryption and multi-signature wallets.")}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg">
              <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">{translate("Expert Management")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {translate("Our team of crypto experts actively manages your portfolio to maximize returns.")}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg">
              <CheckCircle2 className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">{translate("Proven Results")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {translate("Track record of delivering consistent returns even in volatile markets.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans Section */}
      <section id="plans" className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{translate("Investment Plans")}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {translate("Choose your investment plan and start earning daily returns")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {INVESTMENT_PLANS.map((plan) => (
              <Card key={plan.name} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{translate(plan.name)}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{translate(plan.description)}</p>
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-blue-600">{plan.price}</p>
                    <p className="text-xl font-semibold text-green-600">{translate(plan.dailyReturn)}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">{translate("Duration")}: {plan.duration}</p>
                      <p className="text-sm text-gray-600">{translate("Referral Bonus")}: {plan.referralBonus}</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm">{translate(feature)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full">{translate("Start Investing")}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white dark:bg-gray-800 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{translate("How to Get Started")}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {translate("Begin your investment journey in four simple steps")}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{translate(step.title)}</h3>
                <p className="text-gray-600 dark:text-gray-300">{translate(step.description)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{translate("What Our Investors Say")}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {translate("Don't just take our word for it - hear from our satisfied investors")}
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <Carousel
              opts={{
                align: "start",
                loop: true
              }}
              className="w-full"
            >
              <CarouselContent>
                {TESTIMONIALS.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-4">
                      <Card>
                        <CardContent className="p-6">
                          <Quote className="h-8 w-8 text-blue-600 mb-4" />
                          <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {translate(testimonial.content)}
                          </p>
                          <div className="flex items-center">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                            <div>
                              <h4 className="font-semibold">{translate(testimonial.name)}</h4>
                              <p className="text-sm text-gray-500">{translate(testimonial.role)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{translate("Contact Us")}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {translate("Have questions? Our team is here to help 24/7")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{translate("Email")}</h3>
              <p className="text-gray-600">profitedge.netlify@gmail.com</p>
            </div>
            <div className="text-center">
              <Phone className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{translate("Phone")}</h3>
              <p className="text-gray-600">+1 (718) 650-3987</p>
            </div>
            <div className="text-center">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{translate("Location")}</h3>
              <p className="text-gray-600">New York, NY</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bitcoin className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">Profitedge</span>
              </div>
              <p className="text-gray-400">
                {translate("Your trusted partner in crypto investments")}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">{translate("Quick Links")}</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white">{translate("About Us")}</a></li>
                <li><a href="#plans" className="text-gray-400 hover:text-white">{translate("Investment Plans")}</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white">{translate("How It Works")}</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white">{translate("Contact")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">{translate("Legal")}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">{translate("Privacy Policy")}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{translate("Terms of Service")}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{translate("Risk Disclosure")}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{translate("AML Policy")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">{translate("Connect With Us")}</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <ExternalLink className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Mail className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Phone className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Profitedge. {translate("All rights reserved.")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
