'use client'

import React, { useState, useEffect } from 'react'
import { createEventAction, getArtists } from '@/app/actions/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PlusCircle, Clock, Calendar as CalendarIcon, FileText, Users, X } from 'lucide-react'
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
                toast.warning("Evento salvo, mas atenção: Possível choque de data detectado!")
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

    const formattedDate = selectedDate ? new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : ''

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-br from-zinc-900 to-black p-6 border-b border-zinc-800">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                    <PlusCircle className="w-5 h-5 text-white" />
                                </div>
                                <DialogTitle className="text-xl font-bold tracking-tight text-white">Adicionar Evento</DialogTitle>
                            </div>
                            <DialogDescription className="text-zinc-500 text-sm flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5" /> {formattedDate}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Nome do Evento
                                </Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Baile do Clubber" required className="bg-zinc-900 border-zinc-800 focus:border-white/20 h-10 transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_time" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Início
                                    </Label>
                                    <Input id="start_time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="bg-zinc-900 border-zinc-800 focus:border-white/20 h-10 transition-all" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_time" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-zinc-500" /> Fim
                                    </Label>
                                    <Input id="end_time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-zinc-900 border-zinc-800 focus:border-white/20 h-10 transition-all" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Atrações
                                </Label>
                                
                                {selectedArtists.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                        {selectedArtists.map(id => {
                                            const art = artists.find(a => a.id === id)
                                            return (
                                                <div key={id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-xs text-white">
                                                    <span>{art?.name}</span>
                                                    <button type="button" onClick={() => setSelectedArtists(selectedArtists.filter(ai => ai !== id))} className="text-zinc-500 hover:text-white transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <Select onValueChange={handleArtistSelect}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-0 focus:ring-offset-0 h-10 transition-all">
                                        <SelectValue placeholder="Adicionar Atração..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">
                                        <SelectItem value="NEW" className="font-bold text-white border-b border-zinc-900 mb-1 py-2">
                                            <div className="flex items-center gap-2">
                                                <PlusCircle className="w-4 h-4" /> Nova Atração
                                            </div>
                                        </SelectItem>
                                        {artists.filter(a => !selectedArtists.includes(a.id)).map(a => (
                                            <SelectItem key={a.id} value={a.id} className="py-2">{a.name} <span className="text-[10px] text-zinc-500 ml-1">({a.genre})</span></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Descrição</Label>
                                <textarea id="desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes opcionais..." className="bg-zinc-900 border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-white/20 transition-all resize-none text-zinc-100" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold h-11 rounded-xl transition-all">
                                CANCELAR
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-2 bg-white text-black hover:bg-zinc-200 font-bold h-11 rounded-xl transition-all shadow-lg shadow-white/5 uppercase tracking-wide">
                                {loading ? 'SALVANDO...' : 'CRIAR EVENTO'}
                            </Button>
                        </div>
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
