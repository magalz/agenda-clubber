import { Suspense } from 'react';
import { CalendarGridSection } from '@/features/calendar/components/calendar-grid-section';
import { CalendarGridSkeleton } from '@/features/calendar/components/calendar-grid-skeleton';

export default function CollectiveDashboardPage() {
    return (
        <div className="flex flex-col w-full p-6 md:p-10 gap-6">
            <h1 className="text-3xl font-bold">Planejamento do Coletivo</h1>
            <Suspense fallback={<CalendarGridSkeleton />}>
                <CalendarGridSection />
            </Suspense>
        </div>
    );
}
