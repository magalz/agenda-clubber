'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { getCalendarEvents } from '@/app/(dashboard)/calendar/actions';
import { CalendarFilters } from './CalendarFilters';
import { EventDetailModal } from './EventDetailModal';
import { useEventsRealtime } from '@/hooks/useEventsRealtime';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'Idea' | 'Planning' | 'Confirmed';
  visibility: 'Anonymous' | 'Identified' | 'Public';
  collective?: { 
    name: string;
    instagram_handle?: string | null;
    website_url?: string | null;
    profile_id?: string;
  };
  genre?: string;
  location?: { name: string; neighborhood: string; region: string };
  artists?: { artist_id: string }[];
}

interface CalendarViewProps {
  availableGenres: string[];
  availableRegions: string[];
  isCollective: boolean;
  currentUserId: string;
}

export function CalendarView({ availableGenres, availableRegions, isCollective, currentUserId }: CalendarViewProps) {
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const genres = useMemo(() => searchParams.get('genres')?.split(',').filter(Boolean) || [], [searchParams]);
  const regions = useMemo(() => searchParams.get('regions')?.split(',').filter(Boolean) || [], [searchParams]);
  const conflictsOnly = searchParams.get('conflicts') === 'true';

  const range = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return { start, end };
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return { start, end };
    }
  }, [currentDate, view]);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCalendarEvents(
        range.start.toISOString(),
        range.end.toISOString(),
        { genres, regions }
      );
      setEvents(data as CalendarEvent[]);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [range, genres, regions]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime Integration
  useEventsRealtime({
    currentUserId,
    onEventChange: (payload) => {
      setLastUpdate(new Date());
      setTimeout(() => setLastUpdate(null), 3000); // Clear notification after 3s

      if (payload.eventType === 'INSERT' && payload.new) {
        setEvents(prev => [...prev, payload.new as unknown as CalendarEvent]);
      } else if (payload.eventType === 'UPDATE' && payload.new && 'id' in payload.new) {
        const newEvent = payload.new as unknown as CalendarEvent;
        setEvents(prev => prev.map(e => e.id === newEvent.id ? newEvent : e));
      } else if (payload.eventType === 'DELETE' && payload.old && 'id' in payload.old) {
        const oldId = (payload.old as { id: string }).id;
        setEvents(prev => prev.filter(e => e.id !== oldId));
      }
    }
  });

  const filteredEvents = useMemo(() => {
    if (!conflictsOnly) return events;
    return events.filter(e => e.status === 'Confirmed' || (e.artists && e.artists.length > 0));
  }, [events, conflictsOnly]);

  const days = eachDayOfInterval({ start: range.start, end: range.end });

  const next = () => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prev = () => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'Planning': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default: return 'bg-zinc-500/20 border-zinc-500/50 text-zinc-400';
    }
  };

  return (
    <div className="space-y-4 h-full relative">
      <CalendarFilters availableGenres={availableGenres} availableRegions={availableRegions} />

      {/* Realtime Notification */}
      {lastUpdate && (
        <div className="absolute top-20 right-4 z-40 bg-zinc-100 text-black px-3 py-1 rounded shadow-xl border border-zinc-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Zap size={12} className="fill-yellow-500 stroke-yellow-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Scene Updated</span>
        </div>
      )}

      <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono border border-zinc-800 rounded shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold uppercase tracking-tighter">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM yyyy')}
            </h2>
            <div className="flex gap-1">
              <button onClick={prev} className="p-1 hover:bg-zinc-900 border border-zinc-800 rounded transition"><ChevronLeft size={16} /></button>
              <button onClick={next} className="p-1 hover:bg-zinc-900 border border-zinc-800 rounded transition"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 p-1 rounded border border-zinc-800">
              <button 
                onClick={() => setView('month')}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition ${view === 'month' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition ${view === 'week' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 flex-1 overflow-hidden min-h-[600px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-[10px] uppercase font-bold text-zinc-600 border-b border-r border-zinc-900 bg-zinc-950/50">
              {day}
            </div>
          ))}

          {days.map((day) => {
            const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.start_time), day));
            return (
              <div 
                key={day.toString()} 
                className={`min-h-[100px] border-b border-r border-zinc-900 p-2 transition group hover:bg-zinc-900/30 ${
                  !isSameMonth(day, currentDate) && view === 'month' ? 'opacity-30' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-bold ${isToday(day) ? 'bg-zinc-100 text-black px-1 rounded' : 'text-zinc-500'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-1 text-[9px] rounded border truncate transition hover:brightness-125 ${getStatusColor(event.status)}`}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {selectedEvent && (
          <EventDetailModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
            isCollective={isCollective}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="animate-pulse text-[10px] uppercase font-bold tracking-widest text-zinc-500">Loading scene...</div>
          </div>
        )}
      </div>
    </div>
  );
}
