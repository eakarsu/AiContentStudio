import { useEffect, useState } from 'react';
import api from '../services/api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContentCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/custom-views/content-calendar?year=${year}&month=${month}`)
      .then((r) => {
        if (!cancelled) {
          setData(r.data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load calendar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  if (loading) return <div className="p-4 text-gray-500">Loading calendar...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!data) return null;

  // Build cells with leading blanks for first weekday
  const cells = [];
  for (let i = 0; i < data.firstWeekday; i += 1) cells.push(null);
  data.days.forEach((d) => cells.push(d));

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => shiftMonth(-1)}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
        >
          Prev
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {data.monthName} {data.year}
        </h3>
        <button
          onClick={() => shiftMonth(1)}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
        >
          Next
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
        {Object.entries(data.statusLegend).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize text-gray-600">{status}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-xs font-medium text-gray-500 text-center py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-24 bg-gray-50 rounded" />;
          }
          return (
            <div
              key={cell.date}
              className="h-24 border border-gray-200 rounded p-1.5 overflow-hidden hover:shadow-sm transition"
            >
              <div className="text-xs font-semibold text-gray-700 mb-1">
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {cell.posts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    title={`${p.platform} — ${p.status} @ ${p.time}`}
                    className="text-[10px] truncate px-1 py-0.5 rounded text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.platform}
                  </div>
                ))}
                {cell.posts.length > 3 && (
                  <div className="text-[10px] text-gray-500">
                    +{cell.posts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
