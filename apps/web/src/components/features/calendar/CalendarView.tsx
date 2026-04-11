'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarEvents } from '@/app/(dashboard)/calendar/actions';
import { CalendarFilters } from './CalendarFilters';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  status: 'Idea' | 'Planning' | 'Confirmed';
  visibility: 'Anonymous' | 'Identified' | 'Public';
  collective?: { name: string };
  genre?: string;
  location?: { name: string; neighborhood: string; region: string };
  artists?: { artist_id: string }[];
}

interface CalendarViewProps {
  availableGenres: string[];
  availableRegions: string[];
}

export function CalendarView({ availableGenres, availableRegions }: CalendarViewProps) {
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
  const regions = searchParams.get('regions')?.split(',').filter(Boolean) || [];
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

  useEffect(() => {
    async function fetchEvents() {
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
    }
    fetchEvents();
  }, [range, searchParams, genres, regions]); // Refetch when filters change

  const filteredEvents = useMemo(() => {
    if (!conflictsOnly) return events;
    // For now, "conflictsOnly" shows events that have artists assigned (simulating high-activity events)
    // In a future story, we could add a 'has_conflict' flag to the view.
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
    <div className="space-y-4 h-full">
      <CalendarFilters availableGenres={availableGenres} availableRegions={availableRegions} />

      <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono border border-zinc-800 rounded shadow-2xl">
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
          {/* Day Labels */}
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

        {/* Detail Sidebar */}
        {selectedEvent && (
          <div className="fixed inset-y-0 right-0 w-80 bg-zinc-950 border-l border-zinc-800 p-6 z-50 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Event Intelligence</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-2xl font-bold tracking-tighter leading-tight">{selectedEvent.title}</h4>
                <p className="text-zinc-500 text-xs mt-1 uppercase font-bold">
                  {selectedEvent.collective?.name || 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div>
                    <p className="text-zinc-600 uppercase font-bold">Status</p>
                    <p className="text-zinc-200">{selectedEvent.status}</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 uppercase font-bold">Visibility</p>
                    <p className="text-zinc-200">{selectedEvent.visibility}</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 uppercase font-bold">Genre</p>
                    <p className="text-zinc-200">{selectedEvent.genre || 'Electronic'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 uppercase font-bold">Location</p>
                    <p className="text-zinc-200">{selectedEvent.location?.name || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-600 uppercase font-bold">Region</p>
                    <p className="text-zinc-200">
                      {selectedEvent.location?.neighborhood ? `${selectedEvent.location.neighborhood}, ` : ''}
                      {selectedEvent.location?.region || 'Fortaleza'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-600 uppercase font-bold">Date</p>
                    <p className="text-zinc-200">{format(new Date(selectedEvent.start_time), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900 text-[10px] text-zinc-600 italic">
                Use this intelligence to coordinate dates and lineups.
              </div>
            </div>
          </div>
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
