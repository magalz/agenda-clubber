'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getArtists() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('artists').select('*').order('name')
    if (error) throw error
    return data
}

export async function createArtist(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const artist = {
        name: formData.get('name') as string,
        country: formData.get('country') as string,
        state: formData.get('state') as string,
        genre: formData.get('genre') as string,
        contact: (formData.get('contact') as string) || null,
        user_id: user.id
    }

    const { data, error } = await supabase.from('artists').insert(artist).select().single()
    if (error) throw error

    revalidatePath('/dashboard')
    return data
}

export async function getEvents() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('events').select('*, event_artists(artist_id, artists(*))')
    if (error) throw error
    return data
}

export async function createEventAction(payload: {
    title: string,
    date: string,
    start_time: string,
    end_time: string,
    description?: string,
    artistIds: string[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check conflict on the same date
    const { data: existingEvents } = await supabase
        .from('events')
        .select('*')
        .eq('date', payload.date)

    let hasConflict = false
    if (existingEvents && existingEvents.length > 0) {
        existingEvents.forEach(e => {
            const pStart = payload.start_time
            const pEnd = payload.end_time || "23:59:59"
            const eStart = e.start_time
            const eEnd = e.end_time || "23:59:59"

            if (
                (pStart >= eStart && pStart <= eEnd) ||
                (pEnd >= eStart && pEnd <= eEnd) ||
                (eStart >= pStart && eStart <= pEnd)
            ) {
                hasConflict = true
            }
        })
    }

    const eventData = {
        title: payload.title,
        date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time || null,
        description: payload.description || null,
        user_id: user.id
    }

    const { data: ev, error } = await supabase.from('events').insert(eventData).select().single()
    if (error) throw error

    // Relation
    if (payload.artistIds && payload.artistIds.length > 0) {
        const relations = payload.artistIds.map((id: string) => ({
            event_id: ev.id,
            artist_id: id
        }))
        await supabase.from('event_artists').insert(relations)
    }

    revalidatePath('/dashboard')
    return { success: true, event: ev, hasConflict }
}
