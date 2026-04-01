'use client'

import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { getEvents } from '@/app/actions/calendar'
import AddEventForm from './AddEventForm'
import DayEventsModal from './DayEventsModal'
import { toast } from 'sonner'

export default function EventCalendar() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isDayModalOpen, setIsDayModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [events, setEvents] = useState<any[]>([])

    const fetchEvents = async () => {
        try {
            const data = await getEvents()
            const formatted = data?.map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                allDay: !e.end_time,
                start_time: e.start_time,
                end_time: e.end_time,
                start: e.start_time ? `${e.date}T${e.start_time}` : e.date,
                end: e.end_time ? `${e.date}T${e.end_time}` : undefined,
                extendedProps: {
                    description: e.description,
                    artists: e.event_artists?.map((ea: any) => ea.artists)
                }
            })) || []
            setEvents(formatted)
        } catch (err: any) {
            toast.error('Erro ao buscar eventos: ' + err.message)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.date)
        setIsDayModalOpen(true)
    }

    const handleEventClick = (info: any) => {
        // Quando clica no evento, também abre o modal do dia para ver detalhes
        setSelectedDate(new Date(info.event.startStr.split('T')[0] + 'T00:00:00'))
        setIsDayModalOpen(true)
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
                    locales={[ptBrLocale]}
                    locale="pt-br"
                    selectable={true}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    events={events}
                    height="100%"
                    timeZone="local"
                    fixedWeekCount={false}
                    handleWindowResize={true}
                    expandRows={true}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false
                    }}
                />
            </div>

            <DayEventsModal
                isOpen={isDayModalOpen}
                onClose={() => setIsDayModalOpen(false)}
                selectedDate={selectedDate}
                events={events}
                onAddEvent={() => setIsAddModalOpen(true)}
            />

            <AddEventForm
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                selectedDate={selectedDate}
                onAdded={() => fetchEvents()}
            />
        </>
    )
}
