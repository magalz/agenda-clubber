'use client';

import { format } from 'date-fns';
import { Instagram, Globe, X, MessageSquare } from 'lucide-react';

interface EventDetailModalProps {
  event: {
    id: string;
    title: string;
    description?: string;
    status: string;
    visibility: string;
    genre?: string;
    start_time: string;
    end_time: string;
    collective?: {
      name: string;
      instagram_handle?: string | null;
      website_url?: string | null;
    } | null;
    location?: {
      name: string;
      neighborhood?: string | null;
      region?: string | null;
    } | null;
  };
  onClose: () => void;
  isCollective: boolean;
}

export function EventDetailModal({ event, onClose, isCollective }: EventDetailModalProps) {
  const showContactInfo = isCollective && event.visibility !== 'Anonymous' && event.collective;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 p-8 w-full max-w-lg shadow-2xl space-y-6 relative font-mono">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
        >
          <X size={20} />
        </button>

        <div className="space-y-4">
          <div className="space-y-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold ${
              event.status === 'Confirmed' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
              event.status === 'Planning' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 
              'bg-zinc-500/10 border-zinc-500/50 text-zinc-400'
            }`}>
              {event.status}
            </span>
            <h2 className="text-3xl font-bold tracking-tighter leading-none pt-2">{event.title}</h2>
            <p className="text-zinc-500 uppercase text-xs font-bold tracking-widest">
              {event.collective?.name || 'Reserved Slot'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-600 uppercase font-bold">Genre</p>
              <p className="text-sm text-zinc-200">{event.genre || 'Electronic'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-600 uppercase font-bold">Visibility</p>
              <p className="text-sm text-zinc-200">{event.visibility}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-600 uppercase font-bold">Schedule</p>
              <p className="text-sm text-zinc-200">
                {format(new Date(event.start_time), 'dd MMM')} | {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-600 uppercase font-bold">Venue</p>
              <p className="text-sm text-zinc-200">{event.location?.name || 'TBD'}</p>
            </div>
          </div>

          {event.description && (
            <div className="space-y-1 pt-4 border-t border-zinc-900">
              <p className="text-[10px] text-zinc-600 uppercase font-bold">Internal Notes</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Arbitration / Contact Section */}
          {isCollective && (
            <div className="pt-6 mt-6 border-t border-zinc-800">
              {showContactInfo ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">
                    Contact for Arbitration
                  </p>
                  <div className="flex justify-center gap-4">
                    {event.collective?.instagram_handle && (
                      <a 
                        href={`https://instagram.com/${event.collective.instagram_handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition text-xs font-bold"
                      >
                        <Instagram size={14} /> Instagram
                      </a>
                    )}
                    {event.collective?.website_url && (
                      <a 
                        href={event.collective.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition text-xs font-bold"
                      >
                        <Globe size={14} /> Website
                      </a>
                    )}
                    {!event.collective?.instagram_handle && !event.collective?.website_url && (
                      <p className="text-[10px] text-zinc-600 italic">No public contact info available</p>
                    )}
                  </div>
                </div>
              ) : event.visibility === 'Anonymous' ? (
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded text-center">
                  <p className="text-[10px] text-zinc-600 uppercase font-bold">Coordination Blocked</p>
                  <p className="text-[9px] text-zinc-700 mt-1 italic">This is an Anonymous reservation. Identity is hidden.</p>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded text-center">
                  <p className="text-[10px] text-zinc-600 uppercase font-bold">Public View</p>
                  <p className="text-[9px] text-zinc-700 mt-1">Detailed coordination only available for collectives.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
