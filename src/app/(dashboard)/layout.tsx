import { CommandPalette } from '@/features/search/components/command-palette';
import { ReactQueryProvider } from '@/lib/react-query/provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CommandPalette />
      <ReactQueryProvider>
        {children}
      </ReactQueryProvider>
    </>
  );
}
