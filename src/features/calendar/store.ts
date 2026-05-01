import { create } from 'zustand';
import type { CalendarEvent } from './types';

interface CalendarStore {
    selectedDate: Date | null;
    isSheetOpen: boolean;
    events: CalendarEvent[];
    setSelectedDate: (date: Date | null) => void;
    setEvents: (events: CalendarEvent[]) => void;
    addEvent: (event: CalendarEvent) => void;
    removeEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
    selectedDate: null,
    isSheetOpen: false,
    events: [],
    setSelectedDate: (date) => set({ selectedDate: date, isSheetOpen: date !== null }),
    setEvents: (events) => set({ events }),
    addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
    removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
