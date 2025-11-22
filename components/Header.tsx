"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReownConnectButton } from "@/app/components/ReownConnectButton";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Swords, User, Smartphone, Trophy } from "lucide-react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { isMiniPayWallet } from "@/app/utils/minipay";

export function Header() {
  const router = useRouter();
  const { context } = useMiniKit();
  const [isMounted, setIsMounted] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMiniPay(isMiniPayWallet());
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    closeMobileMenu();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/95 shadow-sm">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo/Brand */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60">
            <Swords className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              PrediKt
            </h1>
            <p className="text-xs text-muted-foreground">Challenge. Predict. Win.</p>
          </div>
        </button>

        {/* User Info & MiniPay Badge - Hidden on mobile */}
        {isMounted && (
          <div className="hidden md:flex items-center gap-3">
            {isMiniPay && (
              <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                <Smartphone className="h-3 w-3" />
                MiniPay
              </Badge>
            )}
            {context?.user?.displayName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Hey, <span className="font-semibold text-foreground">{context.user.displayName}</span></span>
              </div>
            )}
          </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button 
            onClick={() => router.push("/leaderboard")}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>
          <Button 
            onClick={() => router.push("/create-battle")}
            size="sm"
            className="gap-2"
          >
            <Swords className="h-4 w-4" />
            Battle
          </Button>
          <Button
            onClick={() => router.push("/profile")}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
          <div className="ml-2">
            <ReownConnectButton />
          </div>
        </div>

        {/* Mobile Menu Button & Wallet */}
        <div className="flex md:hidden items-center gap-3">
          <ReownConnectButton />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-primary/10"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMounted && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm md:hidden z-40"
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] bg-background border-l border-border shadow-2xl md:hidden z-50 animate-slideIn">
            <nav className="flex flex-col p-4 space-y-2">
              {/* User Info */}
              {context?.user?.displayName && (
                <div className="px-3 py-2 mb-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-foreground/70">Signed in as</p>
                  <p className="font-semibold text-foreground">{context.user.displayName}</p>
                </div>
              )}

              {/* MiniPay Badge */}
              {isMiniPay && (
                <div className="px-3 py-2 mb-2">
                  <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                    <Smartphone className="h-3 w-3" />
                    MiniPay Wallet
                  </Badge>
                </div>
              )}

              {/* Navigation Items */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigation("/create-battle")}
              >
                <Swords className="h-5 w-5" />
                <span className="text-base">Start Battle</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigation("/leaderboard")}
              >
                <Trophy className="h-5 w-5" />
                <span className="text-base">Leaderboard</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigation("/profile")}
              >
                <User className="h-5 w-5" />
                <span className="text-base">Profile</span>
              </Button>

              {/* Divider */}
              <div className="my-4 border-t border-border" />

              {/* Quick Actions */}
              <div className="px-3 py-2">
                <p className="text-xs text-foreground/50 mb-2">Quick Actions</p>
                <Button
                  onClick={() => handleNavigation("/create-battle")}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Swords className="h-5 w-5" />
                  Create Battle
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
