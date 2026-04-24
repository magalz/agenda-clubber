import { CommandPalette } from '@/features/search/components/command-palette';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CommandPalette />
      {children}
    </>
  );
}
