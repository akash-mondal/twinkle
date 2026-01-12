'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Paste {
  id: string;
  content: string;
  title: string;
  price: string;
  creator: string;
  createdAt: number;
  contentType?: string;
}

const API_BASE = '/api/pastes';

// Fetch a single paste by ID
export function usePaste(id: string | undefined) {
  const [paste, setPaste] = useState<Paste | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`${API_BASE}?id=${id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setPaste(null);
          } else {
            throw new Error('Failed to fetch paste');
          }
        } else {
          const data = await res.json();
          setPaste(data);
        }
      })
      .catch((e) => {
        setError(e.message);
        setPaste(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  return { paste, isLoading, error };
}

// Fetch pastes by creator
export function useMyPastes(creator: string | undefined) {
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!creator) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`${API_BASE}?creator=${creator}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch pastes');
        const data = await res.json();
        setPastes(data);
      })
      .catch((e) => {
        setError(e.message);
        setPastes([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [creator]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { pastes, isLoading, error, refetch };
}

// Create a new paste
export async function createPaste(paste: {
  id: string;
  content: string;
  title: string;
  price: string;
  creator: string;
  contentType?: string;
}): Promise<Paste> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paste),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create paste');
  }

  return res.json();
}

// Update a paste
export async function updatePaste(
  id: string,
  creator: string,
  updates: { content?: string; title?: string }
): Promise<Paste> {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, creator, ...updates }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update paste');
  }

  return res.json();
}

// Delete a paste
export async function deletePaste(id: string, creator: string): Promise<void> {
  const res = await fetch(`${API_BASE}?id=${id}&creator=${creator}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete paste');
  }
}
