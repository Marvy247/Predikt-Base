"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, X, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  verifiedAddresses: {
    eth: string[];
  };
}

interface FarcasterUserSearchProps {
  onSelectUser: (address: string, username: string) => void;
  selectedUsername?: string;
  onClear?: () => void;
}

export function FarcasterUserSearch({ onSelectUser, selectedUsername, onClear }: FarcasterUserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([]);
  const [followers, setFollowers] = useState<FarcasterUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const { context } = useMiniKit();

  const loadFollowers = useCallback(async () => {
    if (!context?.user?.fid) return;

    setIsLoadingFollowers(true);
    try {
      // Using Neynar API (free tier) for Farcaster data
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${context.user.fid}`,
        {
          headers: {
            'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const user = data.users?.[0];
        if (user?.following_count > 0) {
          // Load some followers (limited to 10 for better UX)
          const followersResponse = await fetch(
            `https://api.neynar.com/v2/farcaster/following?fid=${context.user.fid}&limit=10`,
            {
              headers: {
                'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS',
              },
            }
          );

          if (followersResponse.ok) {
            const followersData = await followersResponse.json();
            const formattedFollowers = followersData.users?.map((u: Record<string, unknown>) => ({
              fid: u.fid as number,
              username: u.username as string,
              displayName: u.display_name as string,
              pfpUrl: u.pfp_url as string,
              verifiedAddresses: {
                eth: (u.verified_addresses as Record<string, unknown>)?.eth_addresses as string[] || [],
              },
            })) || [];
            setFollowers(formattedFollowers);
          }
        }
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, [context?.user?.fid]);

  // Load followers when component mounts if in Farcaster context
  useEffect(() => {
    if (context?.user?.fid) {
      loadFollowers();
    }
  }, [context?.user?.fid, loadFollowers]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using Neynar API for user search
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const users = data.result?.users?.map((u: Record<string, unknown>) => ({
          fid: u.fid as number,
          username: u.username as string,
          displayName: u.display_name as string,
          pfpUrl: u.pfp_url as string,
          verifiedAddresses: {
            eth: (u.verified_addresses as Record<string, unknown>)?.eth_addresses as string[] || [],
          },
        })) || [];
        setSearchResults(users);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchUsers]);

  const handleSelectUser = (user: FarcasterUser) => {
    const address = user.verifiedAddresses.eth[0];
    if (!address) {
      toast.error('This user has no verified Ethereum address');
      return;
    }
    onSelectUser(address, user.username);
    setSearchQuery("");
    setShowResults(false);
    setShowFollowers(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    onClear?.();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="opponent-search">Challenge Someone</Label>
        
        {selectedUsername ? (
          <div className="flex items-center gap-2 p-4 rounded-lg border-2 border-primary bg-primary/5">
            <User className="h-5 w-5 text-primary" />
            <span className="flex-1 font-semibold">@{selectedUsername}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="opponent-search"
                type="text"
                placeholder="Search by username... (e.g., vitalik, dwr)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 p-2 shadow-lg border-2">
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.fid}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                    >
                      {user.pfpUrl ? (
                        <Image
                          src={user.pfpUrl}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                      {user.verifiedAddresses.eth.length > 0 && (
                        <Badge variant="outline" className="text-xs">✓ Verified</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Select from Followers */}
            {!showResults && followers.length > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFollowers(!showFollowers)}
                  className="w-full gap-2"
                >
                  <Users className="h-4 w-4" />
                  {showFollowers ? 'Hide' : 'Choose from'} your following
                </Button>

                {showFollowers && (
                  <Card className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    {isLoadingFollowers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      followers.map((user) => (
                        <button
                          key={user.fid}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
                        >
                          {user.pfpUrl ? (
                            <Image
                              src={user.pfpUrl}
                              alt={user.username}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.displayName}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </Card>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              💡 Search for a Farcaster username or leave blank to challenge anyone
            </p>
          </>
        )}
      </div>
    </div>
  );
}
