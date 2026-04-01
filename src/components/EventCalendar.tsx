'use client'

import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// Placeholder components that will be replaced later
const AddEventDialog = ({ isOpen, onClose, selectedDate }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-zinc-900 p-6 rounded-md w-full max-w-md border border-zinc-800">
                <h3 className="text-xl text-white mb-4">Adicionar Evento</h3>
                <p className="text-zinc-400 mb-4">Data selecionada: {selectedDate?.toISOString()}</p>
                <button onClick={onClose} className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-md">Fechar</button>
            </div>
        </div>
    )
}

export default function EventCalendar() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Dummy events
    const [events, setEvents] = useState([
        { title: 'Techno Night', date: new Date().toISOString().split('T')[0] }
    ])

    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.date)
        setIsModalOpen(true)
    }

    return (
        <>
            <div className="h-full w-full calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    locale="pt-br"
                    selectable={true}
                    dateClick={handleDateClick}
                    events={events}
                    height="100%"
                    navLinks={true}
                    themeSystem="standard" // We will override styles in globals.css
                />
            </div>

            <AddEventDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
            />
        </>
    )
}
