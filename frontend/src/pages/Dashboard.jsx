import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiVideo, FiMusic, FiFileText, FiImage, FiGlobe,
  FiAlignLeft, FiSearch, FiShare2, FiMail, FiEdit,
  FiDollarSign, FiFilm, FiMic, FiHeadphones, FiArrowRight
} from 'react-icons/fi';

const features = [
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

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
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
  );
}
