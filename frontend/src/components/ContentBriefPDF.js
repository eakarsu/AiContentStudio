import { useState } from 'react';
import api from '../services/api';

const TONES = ['Informative', 'Conversational', 'Authoritative', 'Playful', 'Inspirational'];
const LENGTHS = [
  'Short (500-800 words)',
  'Medium (1000-1500 words)',
  'Long (2000-3000 words)',
  'Pillar (4000+ words)',
];

export default function ContentBriefPDF() {
  const [topic, setTopic] = useState('Content marketing for SaaS startups');
  const [audience, setAudience] = useState('B2B marketers at early-stage SaaS companies');
  const [tone, setTone] = useState('Informative');
  const [length, setLength] = useState('Medium (1000-1500 words)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(
        '/custom-views/content-brief',
        { topic, audience, tone, length },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `content-brief-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Content Brief Generator
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. SEO basics for ecommerce"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. Solo founders"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Generating PDF...' : 'Generate Brief (PDF)'}
        </button>
      </div>
    </div>
  );
}
