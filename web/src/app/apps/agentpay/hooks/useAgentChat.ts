'use client';

import { useState, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://159.89.160.130/api/1';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface PaymentRequest {
  requestId: string;
  payTo: string;
  amount: string;
  validUntil: number;
  description: string;
}

export interface PendingPayment {
  tool: string;
  sourceId: string;
  args: Record<string, unknown>;
  cost: string;
  paymentRequest: PaymentRequest;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  pendingPayment: PendingPayment | null;
  activeSourceId: string | null;
  error: string | null;
}

export function useAgentChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    sessionId: null,
    pendingPayment: null,
    activeSourceId: null,
    error: null,
  });

  const sendMessage = useCallback(async (content: string, userAddress?: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      pendingPayment: null,
      activeSourceId: null,
    }));

    try {
      const response = await fetch(`${API_BASE}/agentpay/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: state.sessionId,
          userAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'payment_required') {
        // Tool call requires payment
        setState((prev) => ({
          ...prev,
          isLoading: false,
          sessionId: data.sessionId,
          pendingPayment: {
            tool: data.tool,
            sourceId: data.sourceId,
            args: data.args,
            cost: data.cost,
            paymentRequest: data.paymentRequest,
          },
          activeSourceId: data.sourceId,
        }));
      } else if (data.status === 'complete') {
        // Got response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || '',
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          sessionId: data.sessionId,
          pendingPayment: null,
          activeSourceId: null,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [state.sessionId]);

  const executeAfterPayment = useCallback(async (accessProofId?: string, txHash?: string) => {
    if (!state.sessionId || !state.pendingPayment) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/agentpay/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          accessProofId,
          txHash,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'complete') {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || '',
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          pendingPayment: null,
          activeSourceId: data.sourceId, // Keep active briefly to show which source
        }));

        // Clear active source after animation
        setTimeout(() => {
          setState((prev) => ({ ...prev, activeSourceId: null }));
        }, 2000);
      } else if (data.status === 'error') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.error || 'API call failed',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to execute',
      }));
    }
  }, [state.sessionId, state.pendingPayment]);

  const cancelPayment = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingPayment: null,
      activeSourceId: null,
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      sessionId: null,
      pendingPayment: null,
      activeSourceId: null,
      error: null,
    });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    pendingPayment: state.pendingPayment,
    activeSourceId: state.activeSourceId,
    error: state.error,
    sendMessage,
    executeAfterPayment,
    cancelPayment,
    clearChat,
  };
}
