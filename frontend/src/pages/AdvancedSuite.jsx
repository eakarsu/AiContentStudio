import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiTrendingUp, FiLayers, FiHeart, FiUsers,
  FiGlobe, FiShare2, FiKey, FiDownload, FiPlay,
  FiZap, FiPackage, FiTarget, FiBookOpen,
  FiRefreshCw, FiUpload,
} from 'react-icons/fi';
import api, { apiKeyApi } from '../services/api';

const TABS = [
  { id: 'analytics', label: 'Performance Dashboard', icon: FiTrendingUp },
  { id: 'brand-voice', label: 'Brand Voice Cloning', icon: FiHeart },
  { id: 'batch', label: 'Batch Repurpose Pipeline', icon: FiLayers },
  { id: 'cluster', label: 'Content Cluster', icon: FiPackage },
  { id: 'repurpose-video', label: 'Repurpose Video', icon: FiShare2 },
  { id: 'brand-story', label: 'Brand Story', icon: FiBookOpen },
  { id: 'seo-keywords', label: 'SEO Keyword Suggester', icon: FiTarget },
  { id: 'engagement', label: 'Optimize for Engagement', icon: FiZap },
  { id: 'social-variants', label: 'Social Variants', icon: FiShare2 },
  { id: 'predict-perf', label: 'Predict Performance', icon: FiTrendingUp },
  { id: 'plagiarism-ai', label: 'Detect Plagiarism (AI)', icon: FiPlay },
  { id: 'multi-language', label: 'Multi-Language Workflow', icon: FiGlobe },
  { id: 'auto-post', label: 'Social Auto-Posting', icon: FiUpload },
  { id: 'usage-rights', label: 'Usage Rights Tracker', icon: FiTarget },
  { id: 'ab-test', label: 'A/B Test Generator', icon: FiZap },
  { id: 'collab', label: 'Collaboration Hub', icon: FiUsers },
  { id: 'api-keys', label: 'API Keys', icon: FiKey },
  { id: 'export', label: 'Exports & Reports', icon: FiDownload },
];

const VERSIONABLE_TYPES = [
  'blogs', 'emails', 'social', 'press-releases', 'newsletters',
  'scripts', 'podcasts', 'marketing', 'seo', 'text', 'translations',
  'summaries', 'voiceovers', 'music',
];

export default function AdvancedSuite() {
  const [tab, setTab] = useState('analytics');
  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Suite</h1>
        <p className="mt-1 text-gray-600">All non-CRUD power-ups: brand voice, batch pipelines, content clusters, exports, API keys and 8 new AI features.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {tab === 'analytics' && <PerformanceDashboard />}
        {tab === 'brand-voice' && <BrandVoicePanel />}
        {tab === 'batch' && <BatchRepurposePanel />}
        {tab === 'cluster' && <ContentClusterPanel />}
        {tab === 'repurpose-video' && <RepurposeVideoPanel />}
        {tab === 'brand-story' && <BrandStoryPanel />}
        {tab === 'seo-keywords' && <SeoKeywordsPanel />}
        {tab === 'engagement' && <EngagementPanel />}
        {tab === 'social-variants' && <SocialVariantsPanel />}
        {tab === 'predict-perf' && <PredictPerformancePanel />}
        {tab === 'plagiarism-ai' && <PlagiarismAIPanel />}
        {tab === 'multi-language' && <MultiLanguagePanel />}
        {tab === 'auto-post' && <AutoPostPanel />}
        {tab === 'usage-rights' && <UsageRightsPanel />}
        {tab === 'ab-test' && <ABTestPanel />}
        {tab === 'collab' && <CollaborationPanel />}
        {tab === 'api-keys' && <ApiKeysPanel />}
        {tab === 'export' && <ExportsPanel />}
      </div>
    </div>
  );
}

/* ============== Sub-panels ============== */

function PerformanceDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const features = ['blogs', 'emails', 'social', 'newsletters', 'press-releases', 'scripts', 'podcasts', 'videos', 'marketing'];

  useEffect(() => {
    Promise.all(features.map(f =>
      api.get(`/${f}`).then(r => ({ feature: f, total: r.data?.pagination?.total ?? r.data?.total ?? (Array.isArray(r.data) ? r.data.length : (r.data?.items?.length || 0)) }))
        .catch(() => ({ feature: f, total: 0 }))
    )).then(rows => {
      const map = {};
      rows.forEach(r => { map[r.feature] = r.total; });
      setStats(map);
      setLoading(false);
    });
  }, []);

  const total = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Content Performance Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">Unified counts across content types.</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-4">
          <div className="text-xs uppercase opacity-80">Total Items</div>
          <div className="text-3xl font-bold mt-1">{total}</div>
        </div>
        {Object.entries(stats).map(([f, c]) => (
          <div key={f} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-xs uppercase text-gray-500">{f}</div>
            <div className="text-2xl font-bold mt-1">{c}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandVoicePanel() {
  const [samples, setSamples] = useState(['', '', '']);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applyText, setApplyText] = useState('');
  const [applyType, setApplyType] = useState('blog');
  const [rewritten, setRewritten] = useState('');

  useEffect(() => {
    api.get('/brand-voice').then(r => setProfile(r.data)).catch(() => setProfile(null));
  }, []);

  const analyze = async () => {
    const filled = samples.filter(s => s.trim().length > 0);
    if (filled.length === 0) return toast.error('Provide at least 1 sample');
    setLoading(true);
    try {
      const r = await api.post('/brand-voice/analyze', { sampleTexts: filled });
      setProfile(r.data.brandVoice);
      toast.success('Brand voice profile saved');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
    setLoading(false);
  };

  const apply = async () => {
    if (!applyText.trim()) return toast.error('Enter content to rewrite');
    setLoading(true);
    try {
      const r = await api.post('/brand-voice/apply', { content: applyText, contentType: applyType });
      setRewritten(r.data.rewrittenContent);
      toast.success('Rewritten in your brand voice');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">AI Brand Voice Cloning</h2>
      <p className="text-sm text-gray-500 mb-6">Train your brand voice from writing samples and apply it to any content.</p>

      {profile && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="font-semibold text-purple-700 mb-2">Active Brand Voice Profile</div>
          <div className="text-sm grid grid-cols-3 gap-2">
            <div><strong>Tone:</strong> {profile.tone || '-'}</div>
            <div><strong>Sentence Length:</strong> {profile.sentenceLength || '-'}</div>
            <div><strong>Vocabulary:</strong> {profile.vocabularyLevel || '-'}</div>
          </div>
        </div>
      )}

      <h3 className="font-semibold mb-2">1. Train your voice</h3>
      <div className="space-y-2 mb-4">
        {samples.map((s, i) => (
          <textarea key={i} className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            rows={3}
            placeholder={`Sample ${i + 1}: paste a piece of your writing`}
            value={s}
            onChange={e => setSamples(prev => prev.map((p, idx) => idx === i ? e.target.value : p))}
          />
        ))}
      </div>
      <button onClick={analyze} disabled={loading}
        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
        {loading ? 'Analyzing...' : 'Analyze & Save Voice'}
      </button>

      <hr className="my-6" />

      <h3 className="font-semibold mb-2">2. Apply to any content</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <select className="border border-gray-300 rounded-lg p-2 text-sm"
          value={applyType} onChange={e => setApplyType(e.target.value)}>
          {['blog', 'email', 'social', 'script', 'podcast', 'newsletter', 'pressRelease', 'marketing'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3" rows={6}
        placeholder="Paste content to rewrite in your brand voice"
        value={applyText} onChange={e => setApplyText(e.target.value)} />
      <button onClick={apply} disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
        {loading ? 'Applying...' : 'Rewrite in My Voice'}
      </button>

      {rewritten && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="font-semibold text-sm mb-2">Rewritten content</div>
          <pre className="whitespace-pre-wrap text-sm">{rewritten}</pre>
        </div>
      )}
    </div>
  );
}

function BatchRepurposePanel() {
  const [originalType, setOriginalType] = useState('blog');
  const [targetType, setTargetType] = useState('social');
  const [contentIds, setContentIds] = useState('');
  const [job, setJob] = useState(null);
  const [polling, setPolling] = useState(false);

  const startBatch = async () => {
    const ids = contentIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    if (ids.length === 0) return toast.error('Provide content IDs');
    try {
      const r = await api.post('/repurpose/batch', { contentIds: ids, originalType, targetType });
      toast.success('Batch queued');
      setJob({ jobId: r.data.jobId, status: 'queued', total: r.data.total, processed: 0 });
      pollJob(r.data.jobId);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const pollJob = async (jobId) => {
    setPolling(true);
    const tick = async () => {
      try {
        const r = await api.get(`/repurpose/batch/${jobId}`);
        setJob(r.data);
        if (r.data.status === 'queued' || r.data.status === 'processing') {
          setTimeout(tick, 2000);
        } else {
          setPolling(false);
        }
      } catch {
        setPolling(false);
      }
    };
    tick();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Batch Repurpose Pipeline</h2>
      <p className="text-sm text-gray-500 mb-6">Queue bulk content transformation with progress tracking.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={originalType} onChange={e => setOriginalType(e.target.value)}>
          {['blog', 'video', 'email', 'social', 'text', 'script', 'podcast', 'marketing', 'seo', 'newsletter', 'pressRelease'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={targetType} onChange={e => setTargetType(e.target.value)}>
          {['blog', 'video', 'email', 'social', 'text', 'script', 'podcast', 'marketing', 'seo', 'newsletter', 'pressRelease'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="border border-gray-300 rounded-lg p-2 text-sm" placeholder="Content IDs (comma separated)"
          value={contentIds} onChange={e => setContentIds(e.target.value)} />
      </div>
      <button onClick={startBatch} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
        <FiPlay className="inline mr-1" /> Start Batch
      </button>

      {job && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="font-semibold mb-2">Job: {job.jobId}</div>
          <div className="text-sm text-gray-600">Status: <strong>{job.status}</strong></div>
          <div className="text-sm text-gray-600 mb-3">Processed: {job.processed} / {job.total}</div>
          <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <div className="bg-primary-600 h-full transition-all" style={{ width: `${(job.processed / Math.max(job.total, 1)) * 100}%` }} />
          </div>
          {polling && <div className="text-xs text-gray-400 mt-2">Polling for status...</div>}
          {job.errors?.length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              {job.errors.length} error(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContentClusterPanel() {
  const [topic, setTopic] = useState('');
  const [num, setNum] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!topic) return toast.error('Topic is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/content-cluster', { topic, num_pieces: num });
      setResult(r.data);
      toast.success('Cluster ready');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Content Cluster (Pillar + Supporting + Social)</h2>
      <p className="text-sm text-gray-500 mb-4">SEO content cluster: pillar page, supporting articles and per-platform social posts.</p>
      <div className="flex gap-2 mb-3">
        <input className="flex-1 border border-gray-300 rounded-lg p-2 text-sm" placeholder="Topic" value={topic} onChange={e => setTopic(e.target.value)} />
        <input type="number" min="2" max="20" className="w-24 border border-gray-300 rounded-lg p-2 text-sm" value={num} onChange={e => setNum(parseInt(e.target.value) || 5)} />
        <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Generate'}</button>
      </div>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function RepurposeVideoPanel() {
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!transcript) return toast.error('Transcript is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/repurpose-video', { video_transcript: transcript, video_title: title });
      setResult(r.data);
      toast.success('Repurposed!');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Repurpose Video Transcript</h2>
      <p className="text-sm text-gray-500 mb-4">Generate blog post, LinkedIn article, tweet thread and email newsletter from one transcript.</p>
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Video title" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={6} placeholder="Paste video transcript" value={transcript} onChange={e => setTranscript(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Repurpose'}</button>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function BrandStoryPanel() {
  const [info, setInfo] = useState('');
  const [aud, setAud] = useState('');
  const [values, setValues] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!info) return toast.error('Company info is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/brand-story', {
        company_info: info,
        target_audience: aud,
        key_values: values.split(',').map(s => s.trim()).filter(Boolean),
      });
      setResult(r.data);
      toast.success('Brand story ready');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Brand Story (5 Formats)</h2>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={3} placeholder="Company info" value={info} onChange={e => setInfo(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Target audience" value={aud} onChange={e => setAud(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Key values (comma separated)" value={values} onChange={e => setValues(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Generate'}</button>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function MultiLanguagePanel() {
  const [text, setText] = useState('');
  const [langs, setLangs] = useState('es,fr,de,it,pt,ja,ko,zh,ar,hi');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text) return toast.error('Provide text to translate');
    setLoading(true);
    setTranslations({});
    const list = langs.split(',').map(s => s.trim()).filter(Boolean);
    const out = {};
    for (const lang of list) {
      try {
        const r = await api.post('/translations', { title: `Auto-${lang}`, originalText: text, sourceLang: 'en', targetLang: lang });
        const id = r.data?.id;
        if (id) {
          await api.post(`/translations/${id}/generate`);
          const fetched = await api.get(`/translations/${id}`);
          out[lang] = fetched.data?.translatedText || fetched.data?.translation || 'Done';
        }
      } catch (e) {
        out[lang] = `Error: ${e.response?.data?.error || 'failed'}`;
      }
      setTranslations({ ...out });
    }
    setLoading(false);
    toast.success('Multi-language workflow complete');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Multi-Language Workflow</h2>
      <p className="text-sm text-gray-500 mb-4">Simultaneous translation across 10+ languages with quality review queue.</p>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={4} placeholder="Source text (English)" value={text} onChange={e => setText(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Target languages (comma separated)" value={langs} onChange={e => setLangs(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? 'Processing...' : 'Run Workflow'}</button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(translations).map(([lang, txt]) => (
          <div key={lang} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs font-semibold text-gray-500 uppercase">{lang}</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{txt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutoPostPanel() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', topic: '', platform: 'twitter', scheduledDate: '' });

  useEffect(() => {
    api.get('/calendar').then(r => setItems(r.data?.items || r.data?.data || (Array.isArray(r.data) ? r.data : []))).catch(() => setItems([]));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/calendar', { ...form, contentType: 'social' });
      toast.success('Scheduled');
      setForm({ title: '', topic: '', platform: 'twitter', scheduledDate: '' });
      const r = await api.get('/calendar');
      setItems(r.data?.items || r.data?.data || (Array.isArray(r.data) ? r.data : []));
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Social Auto-Posting</h2>
      <p className="text-sm text-gray-500 mb-4">Schedule content across platforms from a unified interface (uses Content Calendar API).</p>
      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <input className="border border-gray-300 rounded-lg p-2 text-sm" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input className="border border-gray-300 rounded-lg p-2 text-sm" placeholder="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required />
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
          {['twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok'].map(p => <option key={p}>{p}</option>)}
        </select>
        <input type="date" className="border border-gray-300 rounded-lg p-2 text-sm" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} required />
        <button type="submit" className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm">Schedule</button>
      </form>
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr><th className="text-left p-2">Title</th><th>Platform</th><th>Scheduled</th><th>Status</th></tr></thead>
        <tbody>
          {items.slice(0, 10).map(it => (
            <tr key={it.id} className="border-t">
              <td className="p-2">{it.title}</td>
              <td className="text-center">{it.platform}</td>
              <td className="text-center">{it.scheduledDate ? new Date(it.scheduledDate).toLocaleDateString() : '-'}</td>
              <td className="text-center">{it.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageRightsPanel() {
  const [type, setType] = useState('blogs');
  const [id, setId] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    if (!id) return toast.error('Item ID required');
    setLoading(true);
    try {
      const r = await api.get(`/versions/${type}/${id}`);
      setVersions(r.data.versions || []);
      toast.success(`${r.data.versions?.length || 0} version(s)`);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  const restore = async (versionId) => {
    try {
      await api.post(`/versions/${type}/${id}/restore/${versionId}`);
      toast.success('Restored');
      fetchVersions();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Content Usage Rights & Version History</h2>
      <p className="text-sm text-gray-500 mb-4">Track derivative usage and roll back to any prior version.</p>
      <div className="flex gap-2 mb-4">
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={type} onChange={e => setType(e.target.value)}>
          {VERSIONABLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input className="border border-gray-300 rounded-lg p-2 text-sm" placeholder="Item ID" value={id} onChange={e => setId(e.target.value)} />
        <button onClick={fetchVersions} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
          {loading ? '...' : <><FiRefreshCw className="inline mr-1" /> Load Versions</>}
        </button>
      </div>
      {versions.length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th>Version</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {versions.map(v => (
              <tr key={v.id} className="border-t">
                <td className="p-2">{v.version}</td>
                <td className="text-center">{new Date(v.createdAt).toLocaleString()}</td>
                <td className="text-center">
                  <button onClick={() => restore(v.id)} className="text-primary-600 underline text-xs">Restore</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ABTestPanel() {
  const [items, setItems] = useState([]);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    api.get('/marketing').then(r => setItems(r.data?.items || r.data?.data || [])).catch(() => setItems([]));
  }, []);

  const generate = async () => {
    if (!topic) return toast.error('Topic required');
    try {
      // Create 3 marketing variants with different tones
      const tones = ['urgent', 'curious', 'authoritative'];
      for (const tone of tones) {
        const r = await api.post('/marketing', { title: `${topic} (${tone})`, product: topic, targetAud: tone });
        if (r.data?.id) await api.post(`/marketing/${r.data.id}/generate`);
      }
      toast.success('3 A/B variants created in Marketing');
      const refreshed = await api.get('/marketing');
      setItems(refreshed.data?.items || refreshed.data?.data || []);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">A/B Test Generator</h2>
      <p className="text-sm text-gray-500 mb-4">Auto-create 3 headline/copy variations across distinct psychological triggers.</p>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 border border-gray-300 rounded-lg p-2 text-sm" placeholder="Product / topic" value={topic} onChange={e => setTopic(e.target.value)} />
        <button onClick={generate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">Generate Variants</button>
      </div>
      <div className="text-sm text-gray-500">Generated marketing copies appear in /marketing list.</div>
      <ul className="mt-2 list-disc list-inside text-sm">
        {items.slice(0, 5).map(it => (<li key={it.id}>{it.title}</li>))}
      </ul>
    </div>
  );
}

function CollaborationPanel() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Content Collaboration Hub</h2>
      <p className="text-sm text-gray-500 mb-4">Versioning + audit log power collaboration across the team.</p>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>Audit logs are written automatically for create/update/delete on every feature route.</li>
        <li>Content versioning is available — see "Usage Rights Tracker" tab to view and restore versions.</li>
        <li>RBAC is enforced — viewers can only GET; editors and admins can POST/PUT/DELETE.</li>
        <li>Profile + 2FA can be configured under <a className="text-primary-600 underline" href="/profile">Profile</a>.</li>
      </ul>
    </div>
  );
}

function ApiKeysPanel() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');

  const load = () => apiKeyApi.getAll().then(r => setKeys(r.data?.apiKeys || r.data || [])).catch(() => setKeys([]));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return toast.error('Name required');
    try {
      const r = await apiKeyApi.create({ name });
      toast.success(`Key created: ${r.data?.key || ''}`);
      setName('');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const remove = async (id) => {
    try { await apiKeyApi.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">API Keys</h2>
      <p className="text-sm text-gray-500 mb-4">Programmatic access tokens for the API.</p>
      <div className="flex gap-2 mb-4">
        <input className="border border-gray-300 rounded-lg p-2 text-sm flex-1" placeholder="Key name (e.g. Zapier integration)" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={create} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">Create</button>
      </div>
      {keys.length === 0 ? <div className="text-sm text-gray-500">No keys yet.</div> : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="text-left p-2">Name</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-t">
                <td className="p-2">{k.name}</td>
                <td className="text-center">{k.createdAt && new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="text-center">
                  <button onClick={() => remove(k.id)} className="text-red-600 underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ExportsPanel() {
  const download = async (path, filename) => {
    try {
      const r = await api.get(path, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); link.remove();
    } catch (e) { toast.error('Download failed'); }
  };

  const exports = [
    { label: '30-Day Content Report (PDF)', path: '/export/content-report', filename: `content-report-${new Date().toISOString().split('T')[0]}.pdf` },
    { label: 'Blogs CSV', path: '/export/blogs', filename: 'blogs-export.csv' },
    { label: 'Calendar CSV', path: '/export/calendar', filename: 'calendar-export.csv' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Exports & Reports</h2>
      <p className="text-sm text-gray-500 mb-4">Download CSV/PDF exports for compliance and reporting.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {exports.map(e => (
          <button key={e.path} onClick={() => download(e.path, e.filename)} className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 text-left">
            <FiDownload className="mb-2" />
            <div className="font-medium text-sm">{e.label}</div>
            <div className="text-xs text-gray-500 mt-1">{e.path}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============== Apply pass 4 panels ============== */

function handleAiError(e) {
  if (e.response?.status === 503) {
    return e.response.data?.error || 'OPENROUTER_API_KEY not configured';
  }
  return e.response?.data?.error || 'Failed';
}

function SeoKeywordsPanel() {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [count, setCount] = useState(15);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!topic) return toast.error('Topic is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/suggest-seo-keywords', { topic, audience, count });
      setResult(r.data);
      toast.success('Keywords ready');
    } catch (e) { toast.error(handleAiError(e)); }
    setLoading(false);
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">SEO Keyword Suggester</h2>
      <p className="text-sm text-gray-500 mb-4">Suggest SEO keywords with intent, difficulty and long-tail variants.</p>
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Topic" value={topic} onChange={e => setTopic(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Target audience (optional)" value={audience} onChange={e => setAudience(e.target.value)} />
      <input type="number" min="5" max="50" className="w-32 border border-gray-300 rounded-lg p-2 text-sm mb-2" value={count} onChange={e => setCount(parseInt(e.target.value) || 15)} />
      <div><button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Suggest Keywords'}</button></div>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function EngagementPanel() {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('general');
  const [goal, setGoal] = useState('engagement');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!content) return toast.error('Content is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/optimize-for-engagement', { content, platform, goal });
      setResult(r.data);
      toast.success('Optimized!');
    } catch (e) { toast.error(handleAiError(e)); }
    setLoading(false);
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Optimize for Engagement</h2>
      <p className="text-sm text-gray-500 mb-4">Rewrite content to maximize engagement on a target platform.</p>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={6} placeholder="Paste content" value={content} onChange={e => setContent(e.target.value)} />
      <div className="flex gap-2 mb-2">
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={platform} onChange={e => setPlatform(e.target.value)}>
          {['general', 'twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={goal} onChange={e => setGoal(e.target.value)}>
          {['engagement', 'shares', 'comments', 'clicks', 'conversions'].map(g => <option key={g}>{g}</option>)}
        </select>
        <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Optimize'}</button>
      </div>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function SocialVariantsPanel() {
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState('twitter,linkedin,instagram,facebook,tiktok');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!content) return toast.error('Content is required');
    setLoading(true);
    try {
      const list = platforms.split(',').map(s => s.trim()).filter(Boolean);
      const r = await api.post('/ai/generate-social-variants', { content, platforms: list });
      setResult(r.data);
      toast.success('Variants ready');
    } catch (e) { toast.error(handleAiError(e)); }
    setLoading(false);
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Social Variants</h2>
      <p className="text-sm text-gray-500 mb-4">Tailor a single piece of content into platform-specific variants.</p>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={5} placeholder="Source content" value={content} onChange={e => setContent(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" placeholder="Platforms (comma separated)" value={platforms} onChange={e => setPlatforms(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Generate Variants'}</button>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function PredictPerformancePanel() {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [platform, setPlatform] = useState('general');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!content) return toast.error('Content is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/predict-performance', { content, contentType, platform });
      setResult(r.data);
      toast.success('Prediction ready');
    } catch (e) { toast.error(handleAiError(e)); }
    setLoading(false);
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Predict Content Performance</h2>
      <p className="text-sm text-gray-500 mb-4">AI-driven score and engagement prediction with strengths/weaknesses.</p>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={6} placeholder="Content to analyze" value={content} onChange={e => setContent(e.target.value)} />
      <div className="flex gap-2 mb-2">
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={contentType} onChange={e => setContentType(e.target.value)}>
          {['blog', 'social', 'email', 'video', 'newsletter', 'press_release'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg p-2 text-sm" value={platform} onChange={e => setPlatform(e.target.value)}>
          {['general', 'twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok'].map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Predict'}</button>
      </div>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function PlagiarismAIPanel() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!content) return toast.error('Content is required');
    setLoading(true);
    try {
      const r = await api.post('/ai/detect-plagiarism', { content });
      setResult(r.data);
      toast.success('Analysis ready');
    } catch (e) { toast.error(handleAiError(e)); }
    setLoading(false);
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Detect Plagiarism (AI)</h2>
      <p className="text-sm text-gray-500 mb-4">AI-driven originality analysis with rephrase suggestions for flagged sections.</p>
      <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2" rows={8} placeholder="Content to analyze" value={content} onChange={e => setContent(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">{loading ? '...' : 'Analyze'}</button>
      {result && <pre className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
