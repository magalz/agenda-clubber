import 'server-only';

export interface GeocodedPlace {
    lat: number;
    lng: number;
    displayName: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'AgendaClubber/1.0 (magal@agendaclubber.com)';

export async function geocode(query: string): Promise<GeocodedPlace | null> {
    try {
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate: 0 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.length) return null;
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            displayName: data[0].display_name,
        };
    } catch {
        return null;
    }
}

export async function resolveTimezone(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&current_weather=false`
        );
        const data = await res.json();
        return data.timezone ?? 'America/Sao_Paulo';
    } catch {
        return 'America/Sao_Paulo';
    }
}
