export function diffCalendarDays(a: string, b: string): number {
    const msA = new Date(`${a}T00:00:00Z`).getTime();
    const msB = new Date(`${b}T00:00:00Z`).getTime();
    if (isNaN(msA) || isNaN(msB)) return 999;
    return Math.abs((msA - msB) / 86_400_000);
}
