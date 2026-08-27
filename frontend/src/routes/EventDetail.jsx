import { useParams } from 'react-router-dom';

export default function EventDetail() {
  const { eventId } = useParams();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Event Detail</h1>
      <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-lg text-slate-400">
        <p className="font-mono text-slate-300 mb-2">Event ID: {eventId || 'evt-101'}</p>
        <p>Event Detail — coming in Phase 2</p>
      </div>
    </div>
  );
}
