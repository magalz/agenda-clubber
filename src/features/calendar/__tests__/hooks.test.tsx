import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockFetchCrossCollectiveEvents = vi.fn();
vi.mock('../actions', () => ({
    fetchCrossCollectiveEvents: (...args: unknown[]) => mockFetchCrossCollectiveEvents(...args),
}));

const mockSetCrossEvents = vi.fn();
vi.mock('../store', () => ({
    useCalendarStore: (selector: (s: Record<string, unknown>) => unknown) =>
        selector({ setCrossEvents: mockSetCrossEvents }),
}));

import { useCrossCollectiveEvents } from '../hooks';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('useCrossCollectiveEvents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls setCrossEvents with data after query resolves', async () => {
        const mockData = [{ id: 'ev-1', name: 'Test Event' }];
        mockFetchCrossCollectiveEvents.mockResolvedValue(mockData);

        renderHook(() => useCrossCollectiveEvents([new Date('2026-05-10')]), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(mockSetCrossEvents).toHaveBeenCalledWith(mockData);
        });
    });

    it('does not call setCrossEvents when query fails', async () => {
        mockFetchCrossCollectiveEvents.mockRejectedValue(new Error('Network error'));

        renderHook(() => useCrossCollectiveEvents([new Date('2026-05-10')]), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(mockFetchCrossCollectiveEvents).toHaveBeenCalled();
        });

        expect(mockSetCrossEvents).not.toHaveBeenCalled();
    });

    it('does not fetch when dates array is empty', async () => {
        renderHook(() => useCrossCollectiveEvents([]), {
            wrapper: createWrapper(),
        });

        expect(mockFetchCrossCollectiveEvents).not.toHaveBeenCalled();
        expect(mockSetCrossEvents).not.toHaveBeenCalled();
    });

    it('updates crossEvents on refetch with new data', async () => {
        const initialData = [{ id: 'ev-1', name: 'Initial' }];
        const updatedData = [{ id: 'ev-1', name: 'Updated' }];
        mockFetchCrossCollectiveEvents
            .mockResolvedValueOnce(initialData)
            .mockResolvedValueOnce(updatedData);

        const { rerender } = renderHook(
            (dates: Date[]) => useCrossCollectiveEvents(dates),
            { initialProps: [new Date('2026-05-10')], wrapper: createWrapper() },
        );

        await waitFor(() => {
            expect(mockSetCrossEvents).toHaveBeenCalledWith(initialData);
        });

        rerender([new Date('2026-05-11')]);

        await waitFor(() => {
            expect(mockSetCrossEvents).toHaveBeenCalledWith(updatedData);
        });
    });
});
