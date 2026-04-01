'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle, Clock, Users } from 'lucide-react'

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
        year: 'numeric'
    }) : ''

    const dayEvents = selectedDate ? events.filter(e => {
        const eventDate = new Date(e.date + 'T00:00:00')
        return eventDate.toDateString() === selectedDate.toDateString()
    }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')) : []

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{formattedDate}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Eventos programados para este dia.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col gap-4">
                    {dayEvents.length > 0 ? (
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                            {dayEvents.map((event) => (
                                <div key={event.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:bg-zinc-800 transition-colors">
                                    <h4 className="font-bold text-zinc-50 mb-2">{event.title}</h4>
                                    <div className="flex flex-col gap-1 text-sm text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{event.start_time?.substring(0, 5) || 'O dia todo'}{event.end_time ? ` - ${event.end_time.substring(0, 5)}` : ''}</span>
                                        </div>
                                        {event.extendedProps?.artists && event.extendedProps.artists.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <Users className="w-3.5 h-3.5 mt-0.5" />
                                                <span>{event.extendedProps.artists.map((a: any) => a.name).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                    {event.extendedProps?.description && (
                                        <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{event.extendedProps.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center border-2 border-dashed border-zinc-800 rounded-lg">
                            <p className="text-zinc-500 text-sm">Nenhum evento para este dia.</p>
                        </div>
                    )}

                    <Button 
                        onClick={() => {
                            onClose()
                            onAddEvent()
                        }}
                        className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200 mt-2"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Adicionar Novo Evento
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
