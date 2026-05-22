import { useState } from 'react';
import api from '../services/api';

export default function SEOKeywordTool() {
  const [seed, setSeed] = useState('content marketing');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!seed.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/custom-views/seo-keywords?seed=${encodeURIComponent(seed.trim())}`
      );
      setResults(res.data);
    } catch (e) {
      setError(e.message || 'Failed to fetch keywords');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || !results.keywords?.length) return;
    const header = ['keyword', 'volume', 'difficulty', 'cpc', 'trend', 'intent'];
    const rows = results.keywords.map((k) =>
      header.map((h) => `"${String(k[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-keywords-${results.seed.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const difficultyColor = (d) => {
    if (d < 30) return 'bg-green-100 text-green-700';
    if (d < 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        SEO Keyword Research
      </h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Seed keyword..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !seed.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={handleExportCSV}
          disabled={!results || !results.keywords?.length}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-2 mb-3">
          {error}
        </div>
      )}

      {results && (
        <div className="overflow-x-auto">
          <div className="text-xs text-gray-500 mb-2">
            {results.count} keywords for "{results.seed}"
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Keyword</th>
                <th className="text-right px-3 py-2">Volume</th>
                <th className="text-center px-3 py-2">Difficulty</th>
                <th className="text-right px-3 py-2">CPC</th>
                <th className="text-right px-3 py-2">Trend</th>
                <th className="text-left px-3 py-2">Intent</th>
              </tr>
            </thead>
            <tbody>
              {results.keywords.map((k) => (
                <tr key={k.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-800">{k.keyword}</td>
                  <td className="px-3 py-2 text-right">{k.volume.toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${difficultyColor(k.difficulty)}`}
                    >
                      {k.difficulty}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">${k.cpc.toFixed(2)}</td>
                  <td
                    className={`px-3 py-2 text-right ${k.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {k.trend >= 0 ? '+' : ''}
                    {k.trend}%
                  </td>
                  <td className="px-3 py-2 text-gray-600 capitalize">{k.intent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
