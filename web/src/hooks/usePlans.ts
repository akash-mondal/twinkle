'use client';

import { useState, useEffect } from 'react';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  intervalDays: number;
  trialDays: number;
  creator: string;
  createdAt: string;
}

// Fetch single plan by ID
export function usePlanData(id: string | undefined) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        }
      } catch (e) {
        console.error('Failed to fetch plan:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  return { plan, isLoading };
}

// Fetch all plans by creator
export function useMyPlans(creator: string | undefined) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    if (!creator) return;
    try {
      const res = await fetch(`/api/plans?creator=${creator}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error('Failed to fetch plans:', e);
    }
  };

  useEffect(() => {
    if (!creator) {
      setIsLoading(false);
      return;
    }

    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/plans?creator=${creator}`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (e) {
        console.error('Failed to fetch plans:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [creator]);

  return { plans, isLoading, refetch };
}

// Fetch all plans (for browsing)
export function useAllPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (e) {
        console.error('Failed to fetch plans:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, isLoading };
}

// Create plan
export async function createPlan(plan: {
  id: string;
  name: string;
  description: string;
  price: string;
  intervalDays: number;
  trialDays: number;
  creator: string;
}) {
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create plan');
  }

  return res.json();
}

// Update plan
export async function updatePlan(
  id: string,
  creator: string,
  updates: Partial<Pick<Plan, 'name' | 'description'>>
) {
  const res = await fetch('/api/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, creator, ...updates }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update plan');
  }

  return res.json();
}

// Delete plan
export async function deletePlan(id: string, creator: string) {
  const res = await fetch(`/api/plans?id=${id}&creator=${creator}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete plan');
  }

  return res.json();
}
