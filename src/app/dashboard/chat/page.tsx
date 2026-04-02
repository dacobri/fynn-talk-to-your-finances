'use client';

import { useEffect, useRef, FormEvent, useState } from 'react';
import { useChatStore } from '@/features/finance/utils/chat-store';
import { ChatMessage } from '@/features/finance/components/chat-message';
import { TypingIndicator } from '@/features/finance/components/typing-indicator';
import { ThinkingSteps } from '@/features/finance/components/thinking-steps';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

export default function ChatPage() {
  const {
    messages,
    isLoading,
    thinkingSteps,
    sendMessage
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion);
  };

  // Get last bot message with suggestions
  const lastBotMessage = [...messages].reverse().find((m) => m.role === 'bot' && m.suggestions);

  return (
    <div className='flex h-[calc(100vh-5.5rem)] flex-col gap-4 p-4 sm:p-6 mx-auto w-full max-w-5xl'>
      {/* Messages area */}
      <div className='flex-1 overflow-y-auto space-y-4 pr-2 sm:space-y-3'>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && thinkingSteps.length === 0 && <TypingIndicator />}
        {isLoading && thinkingSteps.length > 0 && <ThinkingSteps steps={thinkingSteps} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Message composer */}
      <form
        onSubmit={handleSubmit}
        className='space-y-2 border-t pt-4 sm:space-y-3'
      >
        {/* Suggestion chips */}
        {!isLoading && lastBotMessage && lastBotMessage.suggestions && lastBotMessage.suggestions.length > 0 && (
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {lastBotMessage.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type='button'
                onClick={() => handleSuggestionClick(suggestion)}
                className='shrink-0 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground transition hover:bg-muted/80 active:scale-95'
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className='flex items-end gap-2 rounded-2xl border bg-background/80 p-3 backdrop-blur sm:gap-3 sm:p-4'>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  handleSubmit(e as any);
                }
              }
            }}
            placeholder='Ask me about your finances... (Enter to send, Shift+Enter for newline)'
            rows={2}
            className='min-h-[3rem] w-full resize-none border-none bg-transparent text-sm focus-visible:ring-0 focus-visible:outline-none sm:min-h-[4rem]'
            disabled={isLoading}
          />
          <Button
            type='submit'
            size='icon'
            disabled={!inputValue.trim() || isLoading}
            className='rounded-full shadow-lg'
          >
            <Icons.send className='h-4 w-4' />
          </Button>
        </div>
      </form>
    </div>
  );
}
