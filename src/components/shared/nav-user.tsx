"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

export function NavUser() {
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await signOutAction();
        });
    };

    return (
        <div className="flex items-center gap-4">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground"
            >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
        </div>
    );
}
