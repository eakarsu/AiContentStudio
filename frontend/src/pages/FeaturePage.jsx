import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiPlay, FiEye, FiX,
  FiClock, FiCheckCircle, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import {
  videoApi, audioApi, textApi, imageApi, translationApi,
  summaryApi, seoApi, socialApi, emailApi, blogApi,
  marketingApi, scriptApi, podcastApi, voiceoverApi, musicApi
} from '../services/api';

const apiMap = {
  videos: videoApi,
  audio: audioApi,
  text: textApi,
  images: imageApi,
  translations: translationApi,
  summaries: summaryApi,
  seo: seoApi,
  social: socialApi,
  emails: emailApi,
  blogs: blogApi,
  marketing: marketingApi,
  scripts: scriptApi,
  podcasts: podcastApi,
  voiceovers: voiceoverApi,
  music: musicApi
};

const formFieldsMap = {
  videos: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Video Description/Prompt', type: 'textarea', required: true },
    { name: 'style', label: 'Style', type: 'select', options: ['professional', 'casual', 'cinematic', 'animated', 'educational'] },
    { name: 'resolution', label: 'Resolution', type: 'select', options: ['720p', '1080p', '4K'] }
  ],
  audio: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Audio Description', type: 'textarea', required: true },
    { name: 'voice', label: 'Voice Type', type: 'select', options: ['neutral', 'female', 'male', 'professional', 'friendly'] },
    { name: 'language', label: 'Language', type: 'select', options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'] }
  ],
  text: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Content Prompt', type: 'textarea', required: true },
    { name: 'type', label: 'Content Type', type: 'select', options: ['general', 'web', 'product', 'marketing', 'legal'] },
    { name: 'tone', label: 'Tone', type: 'select', options: ['professional', 'casual', 'formal', 'friendly', 'persuasive'] }
  ],
  images: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Image Description', type: 'textarea', required: true },
    { name: 'style', label: 'Style', type: 'select', options: ['realistic', 'artistic', 'cartoon', 'minimal', 'abstract'] },
    { name: 'resolution', label: 'Resolution', type: 'select', options: ['512x512', '1024x1024', '1920x1080'] }
  ],
  translations: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'originalText', label: 'Text to Translate', type: 'textarea', required: true },
    { name: 'sourceLang', label: 'Source Language', type: 'select', options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'] },
    { name: 'targetLang', label: 'Target Language', type: 'select', options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'] }
  ],
  summaries: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'originalText', label: 'Text to Summarize', type: 'textarea', required: true },
    { name: 'length', label: 'Summary Length', type: 'select', options: ['short', 'medium', 'long'] }
  ],
  seo: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'keyword', label: 'Target Keyword', type: 'text', required: true }
  ],
  social: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Post Topic', type: 'textarea', required: true },
    { name: 'platform', label: 'Platform', type: 'select', options: ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok'] }
  ],
  emails: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Email Topic/Purpose', type: 'textarea', required: true },
    { name: 'type', label: 'Email Type', type: 'select', options: ['marketing', 'newsletter', 'welcome', 'followup', 'announcement'] }
  ],
  blogs: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'topic', label: 'Blog Topic', type: 'textarea', required: true },
    { name: 'keywords', label: 'Keywords (comma separated)', type: 'text' }
  ],
  marketing: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'product', label: 'Product/Service', type: 'text', required: true },
    { name: 'targetAud', label: 'Target Audience', type: 'text' }
  ],
  scripts: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'topic', label: 'Script Topic', type: 'textarea', required: true },
    { name: 'type', label: 'Script Type', type: 'select', options: ['video', 'podcast', 'presentation', 'audio'] },
    { name: 'duration', label: 'Duration (minutes)', type: 'number' }
  ],
  podcasts: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'topic', label: 'Podcast Topic', type: 'textarea', required: true },
    { name: 'description', label: 'Episode Description', type: 'textarea' }
  ],
  voiceovers: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'text', label: 'Voiceover Text', type: 'textarea', required: true },
    { name: 'voice', label: 'Voice Type', type: 'select', options: ['neutral', 'professional', 'friendly', 'dramatic', 'calm'] },
    { name: 'language', label: 'Language', type: 'select', options: ['en', 'es', 'fr', 'de'] }
  ],
  music: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'prompt', label: 'Music Description', type: 'textarea', required: true },
    { name: 'genre', label: 'Genre', type: 'select', options: ['ambient', 'corporate', 'cinematic', 'pop', 'rock', 'jazz', 'electronic', 'classical'] },
    { name: 'mood', label: 'Mood', type: 'select', options: ['calm', 'uplifting', 'dramatic', 'energetic', 'peaceful', 'happy'] }
  ]
};

const StatusBadge = ({ status }) => {
  const configs = {
    completed: { icon: FiCheckCircle, color: 'bg-green-100 text-green-700', label: 'Completed' },
    processing: { icon: FiLoader, color: 'bg-blue-100 text-blue-700', label: 'Processing' },
    pending: { icon: FiClock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    failed: { icon: FiAlertCircle, color: 'bg-red-100 text-red-700', label: 'Failed' }
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className={status === 'processing' ? 'animate-spin' : ''} size={12} />
      {config.label}
    </span>
  );
};

export default function FeaturePage({ feature, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(null);

  const api = apiMap[feature];
  const formFields = formFieldsMap[feature] || [];

  useEffect(() => {
    fetchItems();
  }, [feature]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getAll();
      setItems(res.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.create(formData);
      setItems([res.data, ...items]);
      setShowModal(false);
      setFormData({});
      toast.success('Created successfully!');
    } catch (error) {
      toast.error('Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (id) => {
    setGenerating(id);
    // Immediately show processing status
    setItems(items.map(item => item.id === id ? { ...item, status: 'processing' } : item));
    toast.loading('Generating with AI...', { id: 'generate-' + id });
    try {
      const res = await api.generate(id);
      setItems(items.map(item => item.id === id ? res.data : item));
      toast.success('Generated successfully!', { id: 'generate-' + id });
    } catch (error) {
      toast.error('Generation failed: ' + (error.response?.data?.error || error.message), { id: 'generate-' + id });
      setItems(items.map(item => item.id === id ? { ...item, status: 'failed' } : item));
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(id);
      setItems(items.filter(item => item.id !== id));
      toast.success('Deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">{items.length} items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <FiPlus size={20} />
          Create New
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No items yet. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.prompt || item.originalText || item.topic || item.keyword || item.product || item.text || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRowClick(item)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleGenerate(item.id)}
                          disabled={generating === item.id}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title={item.status === 'completed' ? 'Regenerate with AI' : 'Generate with AI'}
                        >
                          {generating === item.id ? (
                            <FiLoader className="animate-spin" size={18} />
                          ) : (
                            <FiPlay size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Create New {title.replace(/s$/, '')}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      rows={4}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
                <StatusBadge status={selectedItem.status} />
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Video Player - TOP priority */}
              {selectedItem.videoUrl && selectedItem.videoUrl.startsWith('/uploads') && (
                <div className="bg-black rounded-lg overflow-hidden">
                  <label className="text-sm text-gray-500 block mb-1 px-2 pt-2 bg-gray-900 text-gray-300">Generated Video</label>
                  {selectedItem.videoUrl.endsWith('.mp4') ? (
                    <video controls className="w-full" src={selectedItem.videoUrl}>
                      Your browser does not support the video element.
                    </video>
                  ) : (
                    <audio controls className="w-full p-4" src={selectedItem.videoUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              )}

              {/* Audio Player - show prominently */}
              {selectedItem.audioUrl && selectedItem.audioUrl.startsWith('/uploads') && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
                  <label className="text-sm text-purple-600 font-medium block mb-2">Generated Audio</label>
                  <audio controls className="w-full" src={selectedItem.audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Generated Image - show prominently */}
              {selectedItem.imageUrl && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Generated Image</label>
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="rounded-lg max-w-full"
                  />
                </div>
              )}

              {/* Thumbnail */}
              {selectedItem.thumbnail && !selectedItem.videoUrl && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Thumbnail</label>
                  <img
                    src={selectedItem.thumbnail}
                    alt={selectedItem.title}
                    className="rounded-lg max-w-full"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Updated</label>
                  <p className="font-medium">{formatDate(selectedItem.updatedAt)}</p>
                </div>
              </div>

              {/* Dynamic Content based on feature */}
              {selectedItem.prompt && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Prompt</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.prompt}</p>
                  </div>
                </div>
              )}

              {selectedItem.originalText && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Original Text</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.originalText}</p>
                  </div>
                </div>
              )}

              {selectedItem.content && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Generated Content</label>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.content}</p>
                  </div>
                </div>
              )}

              {selectedItem.translatedText && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Translation</label>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.translatedText}</p>
                  </div>
                </div>
              )}

              {selectedItem.summary && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Summary</label>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.summary}</p>
                  </div>
                </div>
              )}

              {selectedItem.script && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Script</label>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.script}</p>
                  </div>
                </div>
              )}

              {selectedItem.body && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Email Body</label>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.body}</p>
                  </div>
                </div>
              )}

              {selectedItem.description && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Description</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedItem.style && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Style: {selectedItem.style}
                  </span>
                )}
                {selectedItem.voice && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Voice: {selectedItem.voice}
                  </span>
                )}
                {selectedItem.language && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Language: {selectedItem.language}
                  </span>
                )}
                {selectedItem.platform && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Platform: {selectedItem.platform}
                  </span>
                )}
                {selectedItem.genre && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Genre: {selectedItem.genre}
                  </span>
                )}
                {selectedItem.mood && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Mood: {selectedItem.mood}
                  </span>
                )}
                {selectedItem.duration && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Duration: {Math.floor(selectedItem.duration / 60)}:{(selectedItem.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {selectedItem.wordCount && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    Words: {selectedItem.wordCount}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleGenerate(selectedItem.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FiPlay size={18} />
                  {selectedItem.status === 'completed' ? 'Regenerate with AI' : 'Generate with AI'}
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedItem.id);
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-3 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
