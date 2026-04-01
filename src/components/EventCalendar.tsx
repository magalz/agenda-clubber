'use client'

import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getEvents } from '@/app/actions/calendar'
import AddEventForm from './AddEventForm'
import { toast } from 'sonner'

export default function EventCalendar() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [events, setEvents] = useState<any[]>([])

    const fetchEvents = async () => {
        try {
            const data = await getEvents()
            const formatted = data?.map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                allDay: !e.end_time, // Se não tiver endTime consideraremos allDay visualmente
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
                    timeZone="local"
                    eventClick={(info) => {
                        const artistsNames = info.event.extendedProps.artists?.map((a: any) => a.name).join(', ') || 'Nenhuma atração'
                        toast.info(`${info.event.title} - Atrações: ${artistsNames}`)
                    }}
                />
            </div>

            <AddEventForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                onAdded={() => fetchEvents()}
            />
        </>
    )
}
