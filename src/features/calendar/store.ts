import { create } from 'zustand';
import type { CalendarEvent } from './types';

interface CalendarStore {
    selectedDate: Date | null;
    isSheetOpen: boolean;
    events: CalendarEvent[];
    crossEvents: CalendarEvent[];
    setSelectedDate: (date: Date | null) => void;
    setEvents: (events: CalendarEvent[]) => void;
    setCrossEvents: (events: CalendarEvent[]) => void;
    addEvent: (event: CalendarEvent) => void;
    removeEvent: (id: string) => void;
    updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
    selectedDate: null,
    isSheetOpen: false,
    events: [],
    crossEvents: [],
    setSelectedDate: (date) => set({ selectedDate: date, isSheetOpen: date !== null }),
    setEvents: (events) => set({ events }),
    setCrossEvents: (crossEvents) => set({ crossEvents }),
    addEvent: (event) => set((s) => ({
        events: s.events.some((e) => e.id === event.id) ? s.events : [...s.events, event],
    })),
    removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    updateEvent: (id, patch) => set((s) => ({
        events: s.events.map((e) => e.id === id ? { ...e, ...patch } : e),
    })),
}));
