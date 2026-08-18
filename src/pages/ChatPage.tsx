import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { getInitials } from '../lib/utils';
import { MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * A single shared, farm-wide chat — not DMs, not threaded. Reuses the same
 * `announcements` table as the notification bell's Announcements tab (same
 * data, same realtime channel); this page is just a roomier, more
 * conversational way to read and post to it.
 */
export function ChatPage() {
  const { farm, announcements, users } = useFarmData();
  const addAnnouncement = useDataStore((s) => s.addAnnouncement);
  const { activeFarmId, demoMode } = useAppStore();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const myProfile = demoMode ? users[0] : users.find((u) => u.userId === user?.id);
  const displayName = demoMode
    ? (myProfile?.name ?? farm?.owner ?? 'Demo User')
    : (myProfile?.name || (user?.user_metadata?.name as string | undefined) || user?.email || 'My Account');

  // Oldest → newest for a natural top-to-bottom chat reading order
  // (the notification dropdown shows the same data newest-first instead).
  const messages = [...announcements].reverse();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    addAnnouncement(activeFarmId, { authorName: displayName, message: trimmed });
    setMessage('');
    toast.success('Sent');
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });

  let lastDay = '';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      <PageHeader title="Farm Chat" subtitle={`Shared with everyone on ${farm?.name ?? 'this farm'} — not private messages`} />

      <div className="flex-1 min-h-0 flex flex-col card mt-4 overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-2">
              <MessageCircle className="w-10 h-10 text-farm-200" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Say something below — everyone on the farm will see it.</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.authorName === displayName;
              const day = formatDay(m.createdAt);
              const showDayDivider = day !== lastDay;
              lastDay = day;
              const prev = messages[i - 1];
              const showAuthor = !isMe && (showDayDivider || prev?.authorName !== m.authorName);

              return (
                <div key={m.id}>
                  {showDayDivider && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                      <span className="text-xs text-gray-400 font-medium">{day}</span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className={`w-7 h-7 rounded-full bg-farm-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${showAuthor ? '' : 'invisible'}`}>
                        {getInitials(m.authorName)}
                      </div>
                    )}
                    <div className={`max-w-[75%] sm:max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAuthor && <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5 ml-1">{m.authorName}</p>}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-farm-700 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {m.message}
                      </div>
                      <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>{formatTime(m.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2 flex-shrink-0">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Message the farm…"
            className="input flex-1"
            maxLength={500}
          />
          <button onClick={handleSend} disabled={!message.trim()} className="btn-primary px-4 disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
