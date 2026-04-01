'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle, Clock, Users, Calendar as CalendarIcon, MapPin } from 'lucide-react'

interface DayEventsModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date | null
    events: any[]
    onAddEvent: () => void
}

export default function DayEventsModal({ isOpen, onClose, selectedDate, events, onAddEvent }: DayEventsModalProps) {
    const formattedDate = selectedDate ? new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    }) : ''

    const dayEvents = selectedDate ? events.filter(e => {
        const eventDate = new Date(e.date + 'T00:00:00')
        return eventDate.toDateString() === selectedDate.toDateString()
    }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')) : []

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6 border-b border-zinc-800">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <CalendarIcon className="w-5 h-5 text-white" />
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight capitalize">
                                {formattedDate}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-zinc-500 text-sm">
                            {dayEvents.length === 0 
                                ? "Nenhuma programação para este dia." 
                                : `Existem ${dayEvents.length} evento(s) programado(s).`}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <div className="flex flex-col gap-4">
                        {dayEvents.length > 0 ? (
                            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {dayEvents.map((event) => (
                                    <div key={event.id} className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-white/20 hover:bg-zinc-800/50 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white tracking-tight">{event.title}</h4>
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                                <Clock className="w-3 h-3 text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                                                    {event.start_time?.substring(0, 5) || 'Full Day'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {event.extendedProps?.artists && event.extendedProps.artists.length > 0 && (
                                                <div className="flex items-start gap-2">
                                                    <Users className="w-3.5 h-3.5 mt-0.5 text-zinc-500" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {event.extendedProps.artists.map((a: any, i: number) => (
                                                            <span key={i} className="text-xs font-medium text-zinc-300">
                                                                {a.name}{i < event.extendedProps.artists.length - 1 ? ',' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {event.extendedProps?.description && (
                                                <p className="text-xs text-zinc-500 leading-relaxed italic">
                                                    "{event.extendedProps.description}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/20">
                                <div className="bg-zinc-800/50 p-3 rounded-full mb-3">
                                    <CalendarIcon className="w-6 h-6 text-zinc-600" />
                                </div>
                                <p className="text-zinc-500 text-sm font-medium">Dia livre no calendário.</p>
                            </div>
                        )}

                        <Button 
                            onClick={() => {
                                onClose()
                                onAddEvent()
                            }}
                            className="w-full bg-white text-black hover:bg-zinc-200 h-11 font-bold rounded-xl transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2 group mt-2"
                        >
                            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
                            ADICIONAR EVENTO
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
