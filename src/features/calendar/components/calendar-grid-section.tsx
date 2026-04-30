import { getCurrentUserCollective } from '@/features/collectives/queries';
import { CalendarGrid } from './calendar-grid';
import { CalendarEmptyState } from './calendar-empty-state';

function PendingApprovalBanner() {
    return (
        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 rounded-md p-4 w-full text-center">
            <strong>Status: Pendente</strong>
            <p className="text-sm mt-1">
                Seu coletivo foi criado com sucesso e está aguardando revisão dos moderadores da
                Agenda Clubber.
            </p>
        </div>
    );
}

export async function CalendarGridSection() {
    const collective = await getCurrentUserCollective();

    if (!collective) {
        return <CalendarEmptyState />;
    }

    if (collective.status === 'pending_approval') {
        return <PendingApprovalBanner />;
    }

    if (collective.status === 'rejected') {
        return <CalendarEmptyState variant="rejected" />;
    }

    return <CalendarGrid collectiveId={collective.id} />;
}
