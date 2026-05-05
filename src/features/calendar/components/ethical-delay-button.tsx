'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
  duration?: number;
  message?: string;
  disabled?: boolean;
};

const TOAST_MESSAGE = 'Evento confirmado. Lembre-se: a consciência coletiva fortalece a cena.';

export function EthicalDelayButton({
  onConfirm,
  onCancel,
  duration = 3000,
  message = 'Confirmar evento mesmo com conflitos críticos?',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(duration / 1000));
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmedRef = useRef(false);

  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
    onCancelRef.current = onCancel;
  }, [onConfirm, onCancel]);

  const cleanup = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const countdownTick = useCallback(
    (elapsed: number, totalMs: number) => {
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      const rem = Math.max(Math.ceil((totalMs - elapsed) / 1000), 0);
      setProgress(pct);
      setRemainingSeconds(rem);

      if (elapsed >= totalMs && !confirmedRef.current) {
        confirmedRef.current = true;
        cleanup();
        setOpen(false);
        onConfirmRef.current();
        toast.success(TOAST_MESSAGE);
      }
    },
    [cleanup]
  );

  const startCountdown = useCallback(() => {
    const totalMs = duration;
    const tickMs = 100;
    const startTime = Date.now();

    setProgress(0);
    setRemainingSeconds(Math.ceil(totalMs / 1000));
    confirmedRef.current = false;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      countdownTick(elapsed, totalMs);
    }, tickMs);
  }, [duration, countdownTick]);

  useEffect(() => {
    if (open) {
      startCountdown();
    }
    return cleanup;
  }, [open, startCountdown, cleanup]);

  const cancelAndReset = useCallback(() => {
    cleanup();
    setProgress(0);
    setRemainingSeconds(Math.ceil(duration / 1000));
    setOpen(false);
    onCancelRef.current();
  }, [cleanup, duration]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setOpen(true);
      } else if (!confirmedRef.current) {
        cancelAndReset();
      }
    },
    [cancelAndReset]
  );

  const handleManualConfirm = useCallback(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    cleanup();
    setOpen(false);
    onConfirmRef.current();
    toast.success(TOAST_MESSAGE);
  }, [cleanup]);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="mt-2 w-full gap-2"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="w-4 h-4" />
        Confirmar evento
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          role="alertdialog"
          aria-describedby="ethical-delay-desc"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Atenção
            </DialogTitle>
          </DialogHeader>

          <p id="ethical-delay-desc" className="text-sm text-muted-foreground">
            {message}
          </p>

          <div className="space-y-2">
            <Progress value={progress} className="motion-safe:transition-all motion-reduce:transition-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Aguarde...</span>
              <span className="text-xs font-mono tabular-nums" aria-hidden="true">
                {remainingSeconds}s
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelAndReset}>
              Cancelar
            </Button>
            <Button
              variant="default"
              disabled={remainingSeconds > 0}
              onClick={handleManualConfirm}
            >
              {remainingSeconds > 0
                ? `Confirmar (${remainingSeconds})`
                : 'Confirmar Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
