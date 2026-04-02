'use client';

import { create } from 'zustand';
import { sendChatMessageStreaming, sendChatMessage, type UserContext } from './api';
import { useUserPreferences } from './user-preferences-store';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  chart?: any;
  charts?: any[];
  suggestions?: string[];
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingSteps: string[];
  isPanelOpen: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: 'Hi! I\'m Fynn, your AI financial assistant. I can help you understand your spending patterns, identify savings opportunities, and answer questions about your finances.',
  suggestions: [
    'How much did I spend this month?',
    'Show my spending by category',
    'What are my subscriptions?',
    'Top 5 biggest expenses',
    'Monthly spending trend',
    'Summarize my finances'
  ],
  timestamp: new Date()
};

/** Read current user preferences and build the context payload for the API. */
function getUserContext(): UserContext {
  const prefs = useUserPreferences.getState();
  return {
    user_name: prefs.firstName || undefined,
    language: prefs.language || undefined,
    monthly_budget: prefs.monthlyBudget || undefined,
    alert_threshold: prefs.alertThreshold || undefined,
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isLoading: false,
  thinkingSteps: [],
  isPanelOpen: false,

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    set((state) => ({
      messages: [...state.messages, newMessage]
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  togglePanel: () => {
    set((state) => ({
      isPanelOpen: !state.isPanelOpen
    }));
  },

  setPanelOpen: (open: boolean) => {
    set({ isPanelOpen: open });
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return;

    const state = get();

    // Add user message
    state.addMessage({
      role: 'user',
      text: text.trim()
    });

    set({ isLoading: true, thinkingSteps: [] });

    const userContext = getUserContext();

    try {
      const chatHistory = state.messages.map((msg) => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await sendChatMessageStreaming(text, chatHistory, (step) => {
        set((s) => {
          const last = s.thinkingSteps[s.thinkingSteps.length - 1];
          if (last === step) return s; // deduplicate
          return { thinkingSteps: [...s.thinkingSteps, step] };
        });
      }, userContext);

      state.addMessage({
        role: 'bot',
        text: response.text,
        chart: response.chart,
        charts: response.charts,
        suggestions: response.suggestions
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback to non-streaming
      try {
        const chatHistory = state.messages.map((msg) => ({ role: msg.role, text: msg.text }));
        const response = await sendChatMessage(text, chatHistory, userContext);
        state.addMessage({ role: 'bot', text: response.text, chart: response.chart, suggestions: response.suggestions });
      } catch {
        state.addMessage({ role: 'bot', text: 'Sorry, I encountered an error. Please try again.' });
      }
    } finally {
      set({ isLoading: false, thinkingSteps: [] });
    }
  },

  clearMessages: () => {
    set({ messages: [WELCOME_MESSAGE] });
  }
}));
