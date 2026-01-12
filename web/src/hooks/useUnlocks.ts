'use client';

import { useState, useEffect } from 'react';

export interface UserUnlock {
  pasteId: string;
  user: string;
  unlockedAt: string;
}

// Fetch all unlocks for a user
export function useUserUnlocks(user: string | undefined) {
  const [unlocks, setUnlocks] = useState<UserUnlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/unlocks?user=${user}`);
      if (res.ok) {
        const data = await res.json();
        setUnlocks(data);
      }
    } catch (e) {
      console.error('Failed to fetch unlocks:', e);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchUnlocks = async () => {
      try {
        const res = await fetch(`/api/unlocks?user=${user}`);
        if (res.ok) {
          const data = await res.json();
          setUnlocks(data);
        }
      } catch (e) {
        console.error('Failed to fetch unlocks:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnlocks();
  }, [user]);

  return { unlocks, isLoading, refetch };
}

// Check if user has unlocked a specific paste
export function useHasUnlocked(user: string | undefined, pasteId: string | undefined) {
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !pasteId) {
      setIsLoading(false);
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/unlocks?user=${user}&pasteId=${pasteId}`);
        if (res.ok) {
          const data = await res.json();
          setHasUnlocked(data.unlocked);
        }
      } catch (e) {
        console.error('Failed to check unlock:', e);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [user, pasteId]);

  return { hasUnlocked, isLoading };
}

// Record an unlock
export async function recordUnlock(pasteId: string, user: string) {
  const res = await fetch('/api/unlocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pasteId, user }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to record unlock');
  }

  return res.json();
}
