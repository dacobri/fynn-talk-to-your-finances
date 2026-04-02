'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { useChatStore } from '../utils/chat-store';
import { ChatMessage } from './chat-message';
import { TypingIndicator } from './typing-indicator';

export function ChatPanel() {
  const {
    messages,
    isLoading,
    isPanelOpen,
    setPanelOpen,
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
    <Sheet open={isPanelOpen} onOpenChange={setPanelOpen}>
      <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-sm'>
        <SheetHeader className='border-b px-4 py-3 sm:py-4'>
          <SheetTitle className='text-lg sm:text-xl'>Chat with Fynn</SheetTitle>
        </SheetHeader>

        {/* Messages area */}
        <div className='flex-1 overflow-y-auto space-y-3 p-4 sm:space-y-2'>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className='border-t p-3 sm:p-4'>
          <form onSubmit={handleSubmit} className='space-y-2'>
            {/* Suggestion chips row */}
            {!isLoading && lastBotMessage && lastBotMessage.suggestions && (
              <div className='flex gap-1 overflow-x-auto pb-2'>
                {lastBotMessage.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type='button'
                    onClick={() => handleSuggestionClick(suggestion)}
                    className='shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-foreground transition hover:bg-muted/80 active:scale-95'
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className='flex items-end gap-2 rounded-lg border bg-background/80 p-2'>
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
                placeholder='Ask about your finances...'
                rows={2}
                className='min-h-[2.5rem] w-full resize-none border-none bg-transparent text-xs focus-visible:ring-0 focus-visible:outline-none sm:text-sm'
                disabled={isLoading}
              />
              <Button
                type='submit'
                size='icon'
                disabled={!inputValue.trim() || isLoading}
                className='h-8 w-8 shrink-0 rounded-full sm:h-9 sm:w-9'
              >
                <Icons.send className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
