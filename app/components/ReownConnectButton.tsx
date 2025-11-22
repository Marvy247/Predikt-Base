"use client";
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";

export function ReownConnectButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    open()
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected || !address) {
    return (
      <Button
        onClick={handleConnect}
        className="gap-2 font-semibold"
        size="default"
      >
        <Wallet className="h-4 w-4" />
        Connect
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 font-semibold border-2 hover:border-primary/50"
          size="default"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{formatAddress(address)}</span>
          <span className="sm:hidden">{address.slice(0, 4)}...</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Wallet Address</span>
            <span className="font-mono text-sm">{formatAddress(address)}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Address</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
