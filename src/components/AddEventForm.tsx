'use client'

import React, { useState, useEffect } from 'react'
import { createEventAction, getArtists } from '@/app/actions/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PlusCircle, Search } from 'lucide-react'
import AddArtistForm from './AddArtistForm'

export default function AddEventForm({ isOpen, onClose, selectedDate, onAdded }: { isOpen: boolean, onClose: () => void, selectedDate: Date | null, onAdded?: () => void }) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [description, setDescription] = useState('')

    const [artists, setArtists] = useState<any[]>([])
    const [selectedArtists, setSelectedArtists] = useState<string[]>([])

    const [isArtistModalOpen, setArtistModalOpen] = useState(false)

    const fetchArtists = async () => {
        try {
            const data = await getArtists()
            setArtists(data || [])
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchArtists()
            // Reset form
            setTitle('')
            setStartTime('')
            setEndTime('')
            setDescription('')
            setSelectedArtists([])
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDate || !title || !startTime) return

        setLoading(true)
        try {
            // Fix timezone offset by using local YYYY-MM-DD
            const offset = selectedDate.getTimezoneOffset()
            const d = new Date(selectedDate.getTime() - (offset * 60 * 1000))
            const dateStr = d.toISOString().split('T')[0]

            const res = await createEventAction({
                title,
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                description,
                artistIds: selectedArtists
            })

            if (res.hasConflict) {
                toast.warning("Evento salvo, mas atenção: Possível choque de data detectado com outro evento!")
            } else {
                toast.success("Evento criado com sucesso!")
            }

            if (onAdded) onAdded()
            onClose()
        } catch (err: any) {
            toast.error("Erro ao criar evento: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleArtistSelect = (val: string | null) => {
        if (!val) return
        if (val === 'NEW') {
            setArtistModalOpen(true)
        } else if (!selectedArtists.includes(val)) {
            setSelectedArtists([...selectedArtists, val])
        }
    }

    const formattedDate = selectedDate ? new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR') : ''

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Adicionar Evento</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Data selecionada: {formattedDate}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Nome do Evento *</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="bg-zinc-800 border-zinc-700" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start_time">Horário de Início *</Label>
                                <Input id="start_time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="bg-zinc-800 border-zinc-700" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_time">Horário de Fim</Label>
                                <Input id="end_time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                            </div>
                        </div>

                        <div className="grid gap-2 text-sm text-zinc-300">
                            <Label>Atrações</Label>
                            {selectedArtists.map(id => {
                                const art = artists.find(a => a.id === id)
                                return (
                                    <div key={id} className="flex items-center justify-between bg-zinc-800 p-2 rounded border border-zinc-700">
                                        <span>{art?.name}</span>
                                        <button type="button" onClick={() => setSelectedArtists(selectedArtists.filter(ai => ai !== id))} className="text-red-400 text-xs">Remover</button>
                                    </div>
                                )
                            })}

                            <Select onValueChange={handleArtistSelect}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 w-full mt-2">
                                    <SelectValue placeholder="Adicionar Atração..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                                    <SelectItem value="NEW" className="font-bold text-zinc-300"><PlusCircle className="inline w-4 h-4 mr-2" />Nova Atração</SelectItem>
                                    {artists.filter(a => !selectedArtists.includes(a.id)).map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.genre})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2 mt-2">
                            <Label htmlFor="desc">Descrição</Label>
                            <textarea id="desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="bg-zinc-800 border-zinc-700 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-600" />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full mt-4 bg-zinc-100 text-black hover:bg-zinc-300">
                            {loading ? 'Salvando...' : 'Criar Evento'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <AddArtistForm
                isOpen={isArtistModalOpen}
                onClose={() => setArtistModalOpen(false)}
                onAdded={() => fetchArtists()}
            />
        </>
    )
}
