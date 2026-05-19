import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiVideo, FiMusic, FiFileText, FiImage, FiGlobe,
  FiAlignLeft, FiSearch, FiShare2, FiMail, FiEdit,
  FiDollarSign, FiFilm, FiMic, FiHeadphones, FiArrowRight,
  FiCalendar, FiRepeat, FiShield, FiCamera, FiTrendingUp,
  FiList, FiSend, FiFileText as FiPress
} from 'react-icons/fi';

const features = [
  // AI Content Studio Features (NEW)
  {
    id: 'calendar',
    title: 'AI Content Calendar',
    description: 'Plan and schedule your content with AI-powered suggestions',
    icon: FiCalendar,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
    isNew: true
  },
  {
    id: 'repurpose',
    title: 'AI Repurposer',
    description: 'Transform content across formats and platforms instantly',
    icon: FiRepeat,
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    isNew: true
  },
  {
    id: 'plagiarism',
    title: 'AI Plagiarism Checker',
    description: 'Analyze content originality and get improvement suggestions',
    icon: FiShield,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    isNew: true
  },
  {
    id: 'image-suggester',
    title: 'AI Image Suggester',
    description: 'Get smart image recommendations for your content',
    icon: FiCamera,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    isNew: true
  },
  {
    id: 'performance',
    title: 'AI Performance Predictor',
    description: 'Predict content performance before you publish',
    icon: FiTrendingUp,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    isNew: true
  },
  {
    id: 'blog-outlines',
    title: 'AI Blog Outline Creator',
    description: 'Generate SEO-optimized blog outlines in seconds',
    icon: FiList,
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    isNew: true
  },
  {
    id: 'newsletters',
    title: 'AI Newsletter Writer',
    description: 'Create engaging newsletters with AI assistance',
    icon: FiSend,
    color: 'from-teal-500 to-emerald-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    isNew: true
  },
  {
    id: 'press-releases',
    title: 'AI Press Release Writer',
    description: 'Generate professional press releases that get coverage',
    icon: FiPress,
    color: 'from-slate-500 to-gray-700',
    bgColor: 'bg-slate-50',
    iconColor: 'text-slate-600',
    isNew: true
  },
  // Existing Features
  {
    id: 'videos',
    title: 'Video Generation',
    description: 'Create professional video scripts and concepts with AI',
    icon: FiVideo,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500'
  },
  {
    id: 'audio',
    title: 'Audio Generation',
    description: 'Generate audio content, voiceovers, and sound effects',
    icon: FiMusic,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500'
  },
  {
    id: 'text',
    title: 'Text Content',
    description: 'Create compelling written content for any purpose',
    icon: FiFileText,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500'
  },
  {
    id: 'images',
    title: 'Image Generation',
    description: 'Generate unique images and visual content with AI',
    icon: FiImage,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500'
  },
  {
    id: 'translations',
    title: 'Translations',
    description: 'Translate content into multiple languages accurately',
    icon: FiGlobe,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-500'
  },
  {
    id: 'summaries',
    title: 'Summaries',
    description: 'Summarize long content into concise key points',
    icon: FiAlignLeft,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500'
  },
  {
    id: 'seo',
    title: 'SEO Content',
    description: 'Create SEO-optimized content that ranks well',
    icon: FiSearch,
    color: 'from-lime-500 to-green-500',
    bgColor: 'bg-lime-50',
    iconColor: 'text-lime-600'
  },
  {
    id: 'social',
    title: 'Social Media Posts',
    description: 'Generate engaging posts for all social platforms',
    icon: FiShare2,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-500'
  },
  {
    id: 'emails',
    title: 'Email Content',
    description: 'Create effective email campaigns and newsletters',
    icon: FiMail,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-500'
  },
  {
    id: 'blogs',
    title: 'Blog Posts',
    description: 'Write engaging blog articles with AI assistance',
    icon: FiEdit,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-500'
  },
  {
    id: 'marketing',
    title: 'Marketing Copy',
    description: 'Create persuasive marketing copy that converts',
    icon: FiDollarSign,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500'
  },
  {
    id: 'scripts',
    title: 'Scripts',
    description: 'Write professional scripts for videos and podcasts',
    icon: FiFilm,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500'
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    description: 'Create podcast scripts and show notes with AI',
    icon: FiMic,
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-500'
  },
  {
    id: 'voiceovers',
    title: 'Voiceovers',
    description: 'Generate professional voiceover scripts',
    icon: FiHeadphones,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-500'
  },
  {
    id: 'music',
    title: 'Music Generation',
    description: 'Create AI-generated music descriptions and prompts',
    icon: FiMusic,
    color: 'from-fuchsia-500 to-pink-500',
    bgColor: 'bg-fuchsia-50',
    iconColor: 'text-fuchsia-500'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = (featureId) => {
    navigate(`/${featureId}`);
  };

  const newFeatures = features.filter(f => f.isNew);
  const existingFeatures = features.filter(f => !f.isNew);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'Creator'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Choose a content type to get started with AI-powered generation
        </p>
      </div>

      {/* Advanced Suite quick-link */}
      <div
        onClick={() => navigate('/advanced')}
        className="mb-6 cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 flex items-center justify-between hover:shadow-xl transition-shadow"
      >
        <div>
          <div className="text-xs uppercase opacity-80 tracking-wider">Advanced Suite</div>
          <div className="text-2xl font-bold mt-1">Brand Voice · Batch Repurpose · Cluster · Versions · Exports · API Keys</div>
          <div className="text-sm opacity-90 mt-1">8 NEW AI features + analytics + scheduling + multi-language workflow</div>
        </div>
        <FiArrowRight className="text-2xl" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: '127', change: '+12%' },
          { label: 'Generated Today', value: '24', change: '+8%' },
          { label: 'AI Credits Used', value: '3,842', change: '+15%' },
          { label: 'Time Saved', value: '48h', change: '+20%' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className="text-sm text-green-500 font-medium">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* NEW AI Content Studio Features */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">AI Content Studio</h2>
          <span className="px-2 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full">NEW</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {newFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => handleCardClick(feature.id)}
                className="group bg-white rounded-xl p-5 shadow-sm border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer animate-fadeIn relative overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div className={`p-2.5 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <FiArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Content Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {existingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => handleCardClick(feature.id)}
                className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${feature.bgColor}`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <FiArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full bg-gradient-to-r ${feature.color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
