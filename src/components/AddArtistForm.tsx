'use client'

import React, { useState } from 'react'
import { createArtist } from '@/app/actions/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>Nova Atração</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Cadastre um novo artista/atração para o seu evento.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Atração *</Label>
                        <Input id="name" name="name" required className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="country">País *</Label>
                        <Input id="country" name="country" required className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="state">Estado *</Label>
                        <Input id="state" name="state" required className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="genre">Gênero *</Label>
                        <Input id="genre" name="genre" required className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contact">Contato</Label>
                        <Input id="contact" name="contact" className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-zinc-100 text-black hover:bg-zinc-300">
                        {loading ? 'Salvando...' : 'Salvar Atração'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
