'use client';

import { useState, useEffect } from 'react';
import { createEvent, updateEvent, deleteEvent, checkConflicts, checkWarnings } from '@/app/(dashboard)/events/actions';
import { Conflict, Warning, MUSICAL_GENRES } from 'shared';

interface Artist {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  neighborhood: string | null;
  region: string | null;
}

interface Event {
  id: string;
  title: string;
  genre: string;
  status: 'Idea' | 'Planning' | 'Confirmed';
  visibility: 'Anonymous' | 'Identified' | 'Public';
  start_time: string;
  end_time: string;
  location_id: string | null;
  artists?: string[];
}

interface EventDashboardProps {
  initialEvents: Event[];
  availableArtists: Artist[];
  availableLocations: Location[];
}

export function EventDashboard({ initialEvents, availableArtists, availableLocations }: EventDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    if (editingEvent) {
      setSelectedArtists(editingEvent.artists || []);
    } else {
      setSelectedArtists([]);
    }
    setConflicts([]);
    setWarnings([]);
  }, [editingEvent, isModalOpen]);

  async function handleCheckIntelligence(artists: string[], genre: string, locationId: string, start: string, end: string) {
    if (!start || !end) return;

    const isoStart = new Date(start).toISOString();
    const isoEnd = new Date(end).toISOString();

    // Check Artist Conflicts (Red)
    if (artists.length > 0) {
      try {
        const detected = await checkConflicts(artists, isoStart, isoEnd, editingEvent?.id);
        setConflicts(detected);
      } catch (error) {
        console.error('Conflict check failed:', error);
      }
    } else {
      setConflicts([]);
    }

    // Check Genre/Region Warnings (Yellow)
    if (genre && locationId) {
      try {
        const detected = await checkWarnings(genre, locationId, isoStart, isoEnd, editingEvent?.id);
        setWarnings(detected);
      } catch (error) {
        console.error('Warning check failed:', error);
      }
    } else {
      setWarnings([]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append('artists', JSON.stringify(selectedArtists));

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
      } else {
        await createEvent(formData);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-400">Your Events</h2>
        <button
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="bg-zinc-100 text-black px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-300 transition"
        >
          New Event
        </button>
      </div>

      <div className="overflow-x-auto border border-zinc-800 rounded bg-zinc-950">
        <table className="w-full text-left text-xs uppercase font-mono">
          <thead className="bg-zinc-900 text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Genre</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {initialEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-600">No events found</td>
              </tr>
            ) : (
              initialEvents.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-900/50 transition">
                  <td className="p-4 font-bold text-zinc-200">{event.title}</td>
                  <td className="p-4 text-zinc-500">{event.genre}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      event.status === 'Confirmed' ? 'bg-green-950 text-green-400' :
                      event.status === 'Planning' ? 'bg-yellow-950 text-yellow-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500">
                    {new Date(event.start_time).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setIsModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-white underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-900 hover:text-red-500 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 p-8 w-full max-w-md shadow-2xl space-y-6 my-8">
            <h3 className="text-lg font-bold uppercase tracking-widest">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-500 uppercase">Title</label>
                <input
                  name="title"
                  defaultValue={editingEvent?.title}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase">Musical Genre</label>
                  <select
                    name="genre"
                    defaultValue={editingEvent?.genre || 'Electronic (General)'}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                    onChange={(e) => handleCheckIntelligence(
                      selectedArtists, 
                      e.target.value, 
                      (document.getElementsByName('locationId')[0] as HTMLSelectElement).value,
                      (document.getElementsByName('startTime')[0] as HTMLInputElement).value, 
                      (document.getElementsByName('endTime')[0] as HTMLInputElement).value
                    )}
                  >
                    {MUSICAL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase">Location</label>
                  <select
                    name="locationId"
                    defaultValue={editingEvent?.location_id || ''}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                    onChange={(e) => handleCheckIntelligence(
                      selectedArtists, 
                      (document.getElementsByName('genre')[0] as HTMLSelectElement).value,
                      e.target.value,
                      (document.getElementsByName('startTime')[0] as HTMLInputElement).value, 
                      (document.getElementsByName('endTime')[0] as HTMLInputElement).value
                    )}
                  >
                    <option value="" disabled>Select Venue</option>
                    {availableLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.neighborhood || l.region})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase">Status</label>
                  <select
                    name="status"
                    defaultValue={editingEvent?.status || 'Idea'}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Planning">Planning</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase flex justify-between">
                    <span>Visibility</span>
                    <span className="text-[8px] text-zinc-600 normal-case">Impacts &apos;Idea&apos;</span>
                  </label>
                  <select
                    name="visibility"
                    defaultValue={editingEvent?.visibility || 'Anonymous'}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                  >
                    <option value="Anonymous">Anonymous</option>
                    <option value="Identified">Identified</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase">Start Time</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    defaultValue={editingEvent ? new Date(editingEvent.start_time).toISOString().slice(0, 16) : ''}
                    required
                    onChange={(e) => handleCheckIntelligence(
                      selectedArtists, 
                      (document.getElementsByName('genre')[0] as HTMLSelectElement).value,
                      (document.getElementsByName('locationId')[0] as HTMLSelectElement).value,
                      e.target.value, 
                      (document.getElementsByName('endTime')[0] as HTMLInputElement).value
                    )}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase">End Time</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    defaultValue={editingEvent ? new Date(editingEvent.end_time).toISOString().slice(0, 16) : ''}
                    required
                    onChange={(e) => handleCheckIntelligence(
                      selectedArtists, 
                      (document.getElementsByName('genre')[0] as HTMLSelectElement).value,
                      (document.getElementsByName('locationId')[0] as HTMLSelectElement).value,
                      (document.getElementsByName('startTime')[0] as HTMLInputElement).value, 
                      e.target.value
                    )}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 uppercase">Artists</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-zinc-800 p-2 bg-zinc-900 text-[10px]">
                  {availableArtists.map(artist => (
                    <label key={artist.id} className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={selectedArtists.includes(artist.id)}
                        onChange={(e) => {
                          const newArtists = e.target.checked
                            ? [...selectedArtists, artist.id]
                            : selectedArtists.filter(id => id !== artist.id);
                          setSelectedArtists(newArtists);
                          handleCheckIntelligence(
                            newArtists, 
                            (document.getElementsByName('genre')[0] as HTMLSelectElement).value,
                            (document.getElementsByName('locationId')[0] as HTMLSelectElement).value,
                            (document.getElementsByName('startTime')[0] as HTMLInputElement).value, 
                            (document.getElementsByName('endTime')[0] as HTMLInputElement).value
                          );
                        }}
                        className="accent-zinc-100"
                      />
                      <span className="truncate">{artist.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {conflicts.length > 0 && (
                  <div className="p-3 bg-red-950/50 border border-red-900 rounded text-red-200 space-y-1">
                    <p className="font-bold uppercase text-[9px] flex items-center gap-2">
                      <span className="animate-pulse text-xs">⚠️</span> Critical Conflict (Artist)
                    </p>
                    <ul className="text-[8px] list-disc list-inside space-y-0.5">
                      {conflicts.map((c, i) => (
                        <li key={i}>{c.artist_name} is in &quot;{c.title}&quot; by {c.collective_name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="p-3 bg-yellow-950/50 border border-yellow-900 rounded text-yellow-200 space-y-1">
                    <p className="font-bold uppercase text-[9px] flex items-center gap-2">
                      <span className="text-xs">⚠️</span> Strategic Warning (Genre/Region)
                    </p>
                    <ul className="text-[8px] list-disc list-inside space-y-0.5">
                      {warnings.map((w, i) => (
                        <li key={i}>Another {w.genre} event &quot;{w.title}&quot; in {w.neighborhood || w.region}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-zinc-800 py-2 hover:bg-zinc-900 transition uppercase font-bold text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-zinc-100 text-black py-2 hover:bg-zinc-300 transition uppercase font-bold text-[10px] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
