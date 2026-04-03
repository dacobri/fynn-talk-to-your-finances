'use client';

import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '../utils/chat-store';
import { PlotlyChart } from './plotly-chart';

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatText(text: string): string {
  return (
    text
      // bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // numbered list: "1. item" → <li>
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      // bullet list: "- item" or "• item" → <li>
      .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
      // wrap consecutive <li> in <ul>
      .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class="mt-1 space-y-1 pl-4 list-disc">${match}</ul>`)
      // double newline → paragraph break
      .replace(/\n{2,}/g, '</p><p class="mt-2">')
      // single newline → <br>
      .replace(/\n/g, '<br/>')
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === 'bot';
  const isUser = message.role === 'user';

  const formattedText = formatText(message.text);

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {isBot && (
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground'>
          F
        </div>
      )}
      <div className={cn(
        'flex flex-col gap-2',
        isUser ? 'items-end max-w-[65%]' : 'items-start w-full max-w-[88%]'
      )}>
        <div className={cn(
          'w-full rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground'
        )}>
          <div
            className='text-sm leading-6 [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:leading-6 [&_strong]:font-semibold'
            dangerouslySetInnerHTML={{ __html: `<p>${formattedText}</p>` }}
          />
        </div>

        {/* Plotly charts */}
        {(message.charts && message.charts.length > 0 ? message.charts : message.chart ? [message.chart] : []).map((chartJson, i) => (
          <div key={i} className='mt-1 w-full'>
            <PlotlyChart chartJson={chartJson} />
          </div>
        ))}

        {/* Timestamp */}
        <span className='text-xs text-muted-foreground'>
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}
