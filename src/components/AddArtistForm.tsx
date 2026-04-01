'use client'

import React, { useState, useEffect } from 'react'
import { createArtist } from '@/app/actions/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UserPlus, Globe, MapPin, Music, Phone } from 'lucide-react'

export default function AddArtistForm({ isOpen, onClose, onAdded }: { isOpen: boolean, onClose: () => void, onAdded?: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await createArtist(formData)
            toast.success("Atração cadastrada com sucesso!")
            if (onAdded) onAdded()
            onClose()
        } catch (err: any) {
            toast.error("Erro ao cadastrar atração: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6 border-b border-zinc-800">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <UserPlus className="w-5 h-5 text-white" />
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Nova Atração</DialogTitle>
                        </div>
                        <DialogDescription className="text-zinc-500 text-sm">
                            Cadastre um novo artista ou banda para os eventos.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <UserPlus className="w-3 h-3" /> Nome da Atração
                            </Label>
                            <Input id="name" name="name" placeholder="Ex: DJ Clubber" required className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-10" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="country" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> País
                                </Label>
                                <Input id="country" name="country" placeholder="Brasil" required className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-10" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="state" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Estado
                                </Label>
                                <Input id="state" name="state" placeholder="CE" required className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-10" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="genre" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Music className="w-3 h-3" /> Gênero Musical
                            </Label>
                            <Input id="genre" name="genre" placeholder="Ex: Techno, House" required className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-10" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Phone className="w-3 h-3" /> Contato / Redes Sociais
                            </Label>
                            <Input id="contact" name="contact" placeholder="@instagram ou email" className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-10" />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold h-11 rounded-xl transition-all">
                            CANCELAR
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-2 bg-white text-black hover:bg-zinc-200 font-bold h-11 rounded-xl transition-all shadow-lg shadow-white/5">
                            {loading ? 'SALVANDO...' : 'SALVAR ATRAÇÃO'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
