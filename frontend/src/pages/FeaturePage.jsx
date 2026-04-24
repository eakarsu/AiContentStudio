import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiPlay, FiEye, FiX, FiEdit2,
  FiClock, FiCheckCircle, FiAlertCircle, FiLoader,
  FiSearch, FiFilter, FiChevronUp, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiDownload, FiCheck,
  FiSave
} from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import TableSkeleton from '../components/TableSkeleton';
import {
  videoApi, audioApi, textApi, imageApi, translationApi,
  summaryApi, seoApi, socialApi, emailApi, blogApi,
  marketingApi, scriptApi, podcastApi, voiceoverApi, musicApi,
  calendarApi, repurposeApi, plagiarismApi, imageSuggesterApi,
  performanceApi, blogOutlineApi, newsletterApi, pressReleaseApi
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
  music: musicApi,
  calendar: calendarApi,
  repurpose: repurposeApi,
  plagiarism: plagiarismApi,
  'image-suggester': imageSuggesterApi,
  performance: performanceApi,
  'blog-outlines': blogOutlineApi,
  newsletters: newsletterApi,
  'press-releases': pressReleaseApi
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
  ],
  // NEW AI Content Studio Features
  calendar: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'topic', label: 'Content Topic', type: 'textarea', required: true },
    { name: 'contentType', label: 'Content Type', type: 'select', options: ['blog', 'social', 'email', 'video', 'podcast', 'press'], required: true },
    { name: 'platform', label: 'Platform', type: 'select', options: ['website', 'instagram', 'twitter', 'linkedin', 'facebook', 'youtube', 'email', 'tiktok'] },
    { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true }
  ],
  repurpose: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'originalContent', label: 'Original Content', type: 'textarea', required: true },
    { name: 'originalType', label: 'Original Format', type: 'select', options: ['blog', 'video', 'podcast', 'email', 'presentation', 'whitepaper', 'report'], required: true },
    { name: 'targetType', label: 'Target Format', type: 'select', options: ['thread', 'social', 'blog', 'email', 'carousel', 'infographic', 'video', 'tips'], required: true },
    { name: 'targetPlatform', label: 'Target Platform', type: 'select', options: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'website', 'email'] }
  ],
  plagiarism: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'content', label: 'Content to Check', type: 'textarea', required: true }
  ],
  'image-suggester': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'content', label: 'Content to Analyze', type: 'textarea', required: true },
    { name: 'contentType', label: 'Content Type', type: 'select', options: ['blog', 'social', 'email', 'landing', 'video', 'podcast', 'infographic'], required: true }
  ],
  performance: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'content', label: 'Content to Analyze', type: 'textarea', required: true },
    { name: 'contentType', label: 'Content Type', type: 'select', options: ['blog', 'social', 'video', 'email', 'ad', 'press', 'podcast'], required: true },
    { name: 'platform', label: 'Platform', type: 'select', options: ['twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok', 'pinterest', 'reddit', 'email', 'website'] }
  ],
  'blog-outlines': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'topic', label: 'Blog Topic', type: 'textarea', required: true },
    { name: 'targetAudience', label: 'Target Audience', type: 'text' },
    { name: 'keywords', label: 'Keywords (comma separated)', type: 'text' }
  ],
  newsletters: [
    { name: 'title', label: 'Newsletter Name', type: 'text', required: true },
    { name: 'topic', label: 'Newsletter Topic', type: 'textarea', required: true },
    { name: 'audience', label: 'Target Audience', type: 'text' },
    { name: 'frequency', label: 'Frequency', type: 'select', options: ['daily', 'weekly', 'biweekly', 'monthly'] }
  ],
  'press-releases': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'companyName', label: 'Company Name', type: 'text', required: true },
    { name: 'announcement', label: 'Announcement Details', type: 'textarea', required: true },
    { name: 'targetMedia', label: 'Target Media', type: 'select', options: ['tech', 'business', 'industry', 'general', 'financial'] }
  ]
};

const StatusBadge = ({ status }) => {
  const configs = {
    completed: { icon: FiCheckCircle, color: 'bg-green-100 text-green-700', label: 'Completed' },
    processing: { icon: FiLoader, color: 'bg-blue-100 text-blue-700', label: 'Processing' },
    pending: { icon: FiClock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    failed: { icon: FiAlertCircle, color: 'bg-red-100 text-red-700', label: 'Failed' },
    scheduled: { icon: FiClock, color: 'bg-purple-100 text-purple-700', label: 'Scheduled' },
    draft: { icon: FiEdit2, color: 'bg-gray-100 text-gray-700', label: 'Draft' }
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

// --- Shared Helpers & UI Components for Professional Renderers ---

const safeParseJSON = (str) => {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
};

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
    {title && (
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h4>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const BadgeList = ({ items, colorClass = 'bg-blue-100 text-blue-700' }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>{item}</span>
      ))}
    </div>
  );
};

const ScoreGauge = ({ score, label, maxScore = 100, bgClass = 'bg-blue-50', textClass = 'text-blue-600', labelClass = 'text-blue-700' }) => (
  <div className={`flex-1 ${bgClass} rounded-xl p-4 text-center`}>
    <div className={`text-3xl font-bold ${textClass}`}>
      {score}{maxScore === 100 ? '/100' : '%'}
    </div>
    <div className={`text-sm font-medium ${labelClass} mt-1`}>{label}</div>
    <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full ${textClass === 'text-blue-600' ? 'bg-blue-500' : textClass === 'text-green-600' ? 'bg-green-500' : textClass === 'text-purple-600' ? 'bg-purple-500' : textClass === 'text-red-600' ? 'bg-red-500' : textClass === 'text-indigo-600' ? 'bg-indigo-500' : textClass === 'text-cyan-600' ? 'bg-cyan-500' : 'bg-gray-500'}`}
        style={{ width: `${Math.min((score / maxScore) * 100, 100)}%` }}
      />
    </div>
  </div>
);

const NumberedList = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;
  return (
    <ol className={`space-y-2 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-gray-700">
          <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
          <span>{typeof item === 'string' ? item : item.suggestion || item.text || JSON.stringify(item)}</span>
        </li>
      ))}
    </ol>
  );
};

// --- Feature-Specific Detail Renderers ---

const CalendarDetailRenderer = ({ item }) => {
  const keyPoints = safeParseJSON(item.keyPoints);
  const hashtags = safeParseJSON(item.suggestedHashtags);
  const hooks = safeParseJSON(item.contentHooks);
  const related = safeParseJSON(item.relatedTopics);

  if (!item.contentBrief && !keyPoints) return null;

  return (
    <div className="space-y-4">
      {/* Scheduled Date Banner */}
      {item.scheduledDate && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <FiClock className="text-purple-600" size={20} />
          <div>
            <div className="text-sm text-purple-600 font-medium">Scheduled For</div>
            <div className="text-lg font-bold text-purple-800">
              {new Date(item.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          {item.platform && (
            <span className="ml-auto px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">{item.platform}</span>
          )}
        </div>
      )}

      {/* Content Brief */}
      {item.contentBrief && (
        <InfoCard title="Content Brief">
          <p className="text-gray-700 leading-relaxed">{item.contentBrief}</p>
        </InfoCard>
      )}

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <InfoCard title="Key Points">
          <ul className="space-y-2">
            {keyPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {/* Hooks & CTA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hooks && hooks.length > 0 && (
          <InfoCard title="Content Hooks">
            <NumberedList items={hooks} />
          </InfoCard>
        )}
        {item.callToAction && (
          <InfoCard title="Call to Action">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium">{item.callToAction}</p>
            </div>
          </InfoCard>
        )}
      </div>

      {/* Best Time & Tone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {item.bestTimeToPost && (
          <InfoCard title="Best Time to Post">
            <div className="flex items-center gap-2">
              <FiClock className="text-blue-500" size={16} />
              <span className="text-gray-700 font-medium">{item.bestTimeToPost}</span>
            </div>
          </InfoCard>
        )}
        {item.toneGuidance && (
          <InfoCard title="Tone Guidance">
            <p className="text-gray-700">{item.toneGuidance}</p>
          </InfoCard>
        )}
      </div>

      {/* Hashtags */}
      {hashtags && hashtags.length > 0 && (
        <InfoCard title="Suggested Hashtags">
          <BadgeList items={hashtags.map(h => h.startsWith('#') ? h : `#${h}`)} colorClass="bg-blue-100 text-blue-700" />
        </InfoCard>
      )}

      {/* Visual Suggestions */}
      {item.visualSuggestions && (
        <InfoCard title="Visual Suggestions">
          <p className="text-gray-700">{item.visualSuggestions}</p>
        </InfoCard>
      )}

      {/* Related Topics */}
      {related && related.length > 0 && (
        <InfoCard title="Related Topics">
          <BadgeList items={related} colorClass="bg-gray-100 text-gray-700" />
        </InfoCard>
      )}
    </div>
  );
};

const RepurposeDetailRenderer = ({ item }) => {
  return (
    <div className="space-y-4">
      {/* Transformation Flow Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-xs text-indigo-500 font-medium uppercase">Original</div>
          <div className="text-lg font-bold text-indigo-700 capitalize">{item.originalType}</div>
        </div>
        <div className="text-2xl text-indigo-400">&#8594;</div>
        <div className="text-center">
          <div className="text-xs text-purple-500 font-medium uppercase">Target</div>
          <div className="text-lg font-bold text-purple-700 capitalize">{item.targetType}</div>
        </div>
        {item.targetPlatform && (
          <>
            <div className="text-xl text-gray-300">|</div>
            <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium capitalize">{item.targetPlatform}</span>
          </>
        )}
      </div>

      {/* Original Content (collapsible) */}
      {item.originalContent && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <span className="transition-transform group-open:rotate-90">&#9654;</span>
            View Original Content
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{item.originalContent}</p>
          </div>
        </details>
      )}

      {/* Repurposed Output */}
      {item.repurposedContent && (
        <InfoCard title="Repurposed Content">
          <div className="prose prose-sm max-w-none">
            <AIOutputDisplayInner content={item.repurposedContent} />
          </div>
        </InfoCard>
      )}
    </div>
  );
};

const PlagiarismDetailRenderer = ({ item }) => {
  const uniqueElements = safeParseJSON(item.uniqueElements);
  const commonPhrases = safeParseJSON(item.commonPhrases);
  const potentialConcerns = safeParseJSON(item.potentialConcerns);
  const flaggedSections = safeParseJSON(item.flaggedSections);
  const suggestions = safeParseJSON(item.suggestions);

  if (item.originalityScore == null && !item.overallAssessment) return null;

  return (
    <div className="space-y-4">
      {/* Score Gauges */}
      {item.originalityScore != null && (
        <div className="flex gap-4">
          <ScoreGauge score={item.originalityScore} label="Originality" maxScore={100} bgClass="bg-green-50" textClass="text-green-600" labelClass="text-green-700" />
          <ScoreGauge score={item.plagiarismScore} label="Plagiarism Risk" maxScore={100} bgClass="bg-red-50" textClass="text-red-600" labelClass="text-red-700" />
        </div>
      )}

      {/* Style Analysis Ribbon */}
      {(item.readability || item.voiceConsistency || item.toneAppropriate) && (
        <div className="flex gap-3">
          {item.readability && (
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-500 font-medium uppercase">Readability</div>
              <div className="text-sm font-bold text-blue-700 mt-1">{item.readability}</div>
            </div>
          )}
          {item.voiceConsistency && (
            <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <div className="text-xs text-purple-500 font-medium uppercase">Voice</div>
              <div className="text-sm font-bold text-purple-700 mt-1">{item.voiceConsistency}</div>
            </div>
          )}
          {item.toneAppropriate && (
            <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
              <div className="text-xs text-indigo-500 font-medium uppercase">Tone</div>
              <div className="text-sm font-bold text-indigo-700 mt-1">{item.toneAppropriate}</div>
            </div>
          )}
        </div>
      )}

      {/* Overall Assessment */}
      {item.overallAssessment && (
        <InfoCard title="Overall Assessment">
          <p className="text-gray-700 leading-relaxed">{item.overallAssessment}</p>
        </InfoCard>
      )}

      {/* Unique Elements */}
      {uniqueElements && uniqueElements.length > 0 && (
        <InfoCard title="Unique Elements">
          <ul className="space-y-2">
            {uniqueElements.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {/* Common Phrases */}
      {commonPhrases && commonPhrases.length > 0 && (
        <InfoCard title="Common Phrases Detected">
          <BadgeList items={commonPhrases} colorClass="bg-yellow-100 text-yellow-800" />
        </InfoCard>
      )}

      {/* Flagged Sections */}
      {flaggedSections && flaggedSections.length > 0 && (
        <InfoCard title="Flagged Sections">
          <div className="space-y-3">
            {flaggedSections.map((s, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-medium text-sm italic">&ldquo;{s.text}&rdquo;</p>
                {s.concern && <p className="text-red-600 text-sm mt-1"><span className="font-semibold">Concern:</span> {s.concern}</p>}
                {s.suggestion && <p className="text-green-700 text-sm mt-1"><span className="font-semibold">Fix:</span> {s.suggestion}</p>}
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Recommendations */}
      {suggestions && suggestions.length > 0 && (
        <InfoCard title="Recommendations">
          <NumberedList items={suggestions} />
        </InfoCard>
      )}
    </div>
  );
};

const ImageSuggesterDetailRenderer = ({ item }) => {
  const colorPalette = safeParseJSON(item.colorPalette);
  const imagePrompts = safeParseJSON(item.imagePrompts);
  const stockKeywords = safeParseJSON(item.stockKeywords);

  if (!colorPalette && !imagePrompts && !stockKeywords && !item.brandingNotes) return null;

  return (
    <div className="space-y-4">
      {/* Color Palette */}
      {colorPalette && colorPalette.length > 0 && (
        <InfoCard title="Color Palette">
          <div className="flex flex-wrap gap-3">
            {colorPalette.map((color, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: typeof color === 'string' && color.startsWith('#') ? color : '#6B7280' }} />
                <span className="text-sm text-gray-700 font-medium">{color}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* AI Image Prompts */}
      {imagePrompts && imagePrompts.length > 0 && (
        <InfoCard title="AI Image Generation Prompts">
          <div className="space-y-3">
            {imagePrompts.map((p, i) => (
              <div key={i} className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
                <div className="text-gray-500 text-xs mb-1">Prompt {i + 1} {p.style ? `| ${p.style}` : ''} {p.aspectRatio ? `| ${p.aspectRatio}` : ''}</div>
                <code>{p.prompt || p}</code>
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Stock Keywords */}
      {stockKeywords && stockKeywords.length > 0 && (
        <InfoCard title="Stock Photo Keywords">
          <div className="space-y-2">
            {stockKeywords.map((k, i) => (
              <div key={i}>
                <BadgeList items={k.keywords || [k]} colorClass="bg-orange-100 text-orange-700" />
                {k.filters && <p className="text-xs text-gray-500 mt-1">Filters: {k.filters}</p>}
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Branding & Accessibility Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {item.brandingNotes && (
          <InfoCard title="Branding Notes">
            <p className="text-gray-700">{item.brandingNotes}</p>
          </InfoCard>
        )}
        {item.accessibilityNotes && (
          <InfoCard title="Accessibility Notes">
            <p className="text-gray-700">{item.accessibilityNotes}</p>
          </InfoCard>
        )}
      </div>
    </div>
  );
};

const PerformanceDetailRenderer = ({ item }) => {
  const strengths = safeParseJSON(item.strengthAnalysis);
  const weaknesses = safeParseJSON(item.weaknessAnalysis);
  const audience = safeParseJSON(item.audienceAppeal);
  const timing = safeParseJSON(item.timingRecommendations);
  const hashtags = safeParseJSON(item.hashtagSuggestions);
  const headlines = safeParseJSON(item.headlineAlternatives);
  const engagement = safeParseJSON(item.engagementPrediction);
  const improvements = safeParseJSON(item.recommendations);

  if (item.predictedScore == null && !strengths) return null;

  return (
    <div className="space-y-4">
      {/* Score Gauges */}
      {item.predictedScore != null && (
        <div className="flex gap-4">
          <ScoreGauge score={item.predictedScore} label="Performance" bgClass="bg-blue-50" textClass="text-blue-600" labelClass="text-blue-700" />
          <ScoreGauge score={item.viralityScore || 0} label="Virality" bgClass="bg-purple-50" textClass="text-purple-600" labelClass="text-purple-700" />
        </div>
      )}

      {/* Engagement Predictions */}
      {engagement && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {engagement.estimatedLikes != null && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-pink-600">{engagement.estimatedLikes}</div>
              <div className="text-xs text-pink-500 font-medium">Est. Likes</div>
            </div>
          )}
          {engagement.estimatedShares != null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{engagement.estimatedShares}</div>
              <div className="text-xs text-blue-500 font-medium">Est. Shares</div>
            </div>
          )}
          {engagement.estimatedComments != null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{engagement.estimatedComments}</div>
              <div className="text-xs text-green-500 font-medium">Est. Comments</div>
            </div>
          )}
          {engagement.estimatedReach != null && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{engagement.estimatedReach}</div>
              <div className="text-xs text-indigo-500 font-medium">Est. Reach</div>
            </div>
          )}
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <InfoCard title="Strengths">
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-800">{s.element}</span>
                  {s.score != null && <span className="text-sm font-bold text-green-600">{s.score}/100</span>}
                </div>
                {s.impact && <p className="text-sm text-green-700 mt-1">{s.impact}</p>}
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Weaknesses */}
      {weaknesses && weaknesses.length > 0 && (
        <InfoCard title="Areas for Improvement">
          <div className="space-y-3">
            {weaknesses.map((w, i) => (
              <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <span className="font-semibold text-orange-800">{w.element}</span>
                {w.impact && <p className="text-sm text-orange-700 mt-1">{w.impact}</p>}
                {w.suggestion && <p className="text-sm text-blue-700 mt-1"><span className="font-medium">Suggestion:</span> {w.suggestion}</p>}
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Audience Appeal */}
      {audience && (
        <InfoCard title="Audience Appeal">
          <div className="space-y-2">
            {audience.primaryAudience && <p className="text-gray-700"><span className="font-medium">Primary:</span> {audience.primaryAudience}</p>}
            {audience.secondaryAudience && <p className="text-gray-700"><span className="font-medium">Secondary:</span> {audience.secondaryAudience}</p>}
            {audience.emotionalTriggers && audience.emotionalTriggers.length > 0 && (
              <div className="mt-2">
                <span className="text-sm font-medium text-gray-600">Emotional Triggers:</span>
                <BadgeList items={audience.emotionalTriggers} colorClass="bg-pink-100 text-pink-700" />
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Timing Recommendations */}
      {timing && (
        <InfoCard title="Timing Recommendations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {timing.bestDays && timing.bestDays.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">Best Days</div>
                <BadgeList items={timing.bestDays} colorClass="bg-blue-100 text-blue-700" />
              </div>
            )}
            {timing.bestTimes && timing.bestTimes.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">Best Times</div>
                <BadgeList items={timing.bestTimes} colorClass="bg-green-100 text-green-700" />
              </div>
            )}
            {timing.seasonality && (
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">Seasonality</div>
                <p className="text-gray-700 text-sm">{timing.seasonality}</p>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Competitive Analysis */}
      {item.competitiveAnalysis && (
        <InfoCard title="Competitive Analysis">
          <p className="text-gray-700 leading-relaxed">{item.competitiveAnalysis}</p>
        </InfoCard>
      )}

      {/* Hashtags */}
      {hashtags && hashtags.length > 0 && (
        <InfoCard title="Suggested Hashtags">
          <BadgeList items={hashtags.map(h => h.startsWith('#') ? h : `#${h}`)} colorClass="bg-blue-100 text-blue-700" />
        </InfoCard>
      )}

      {/* Headlines */}
      {headlines && headlines.length > 0 && (
        <InfoCard title="Alternative Headlines">
          <NumberedList items={headlines} />
        </InfoCard>
      )}

      {/* Priority Improvements */}
      {improvements && improvements.length > 0 && (
        <InfoCard title="Priority Improvements">
          <div className="space-y-2">
            {improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div>
                  <span className="font-medium text-gray-800">{imp.suggestion || imp}</span>
                  {imp.priority && (
                    <span className={`ml-2 text-xs font-bold uppercase px-2 py-0.5 rounded-full ${imp.priority === 'high' ? 'bg-red-100 text-red-700' : imp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {imp.priority}
                    </span>
                  )}
                  {imp.expectedImpact && <p className="text-sm text-gray-500 mt-0.5">{imp.expectedImpact}</p>}
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </div>
  );
};

const BlogOutlineDetailRenderer = ({ item }) => {
  const targetKeywords = safeParseJSON(item.targetKeywords);
  const contentHooks = safeParseJSON(item.contentHooks);
  const relatedTopics = safeParseJSON(item.relatedTopics);
  const visualSuggestions = safeParseJSON(item.visualSuggestions);
  const suggestions = safeParseJSON(item.suggestions);

  if (!item.subtitle && !item.metaDescription && item.seoScore == null) return null;

  return (
    <div className="space-y-4">
      {/* Title/Subtitle Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
        <h3 className="text-xl font-bold text-indigo-900">{item.title}</h3>
        {item.subtitle && <p className="text-indigo-600 mt-1 text-lg">{item.subtitle}</p>}
        {item.metaDescription && <p className="text-gray-600 mt-2 text-sm italic">{item.metaDescription}</p>}
      </div>

      {/* SEO Score + Word Count + Read Time */}
      <div className="flex gap-4">
        {item.seoScore != null && (
          <ScoreGauge score={item.seoScore} label="SEO Score" bgClass="bg-indigo-50" textClass="text-indigo-600" labelClass="text-indigo-700" />
        )}
        {item.estimatedLength != null && (
          <div className="flex-1 bg-cyan-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyan-600">{item.estimatedLength}</div>
            <div className="text-sm font-medium text-cyan-700 mt-1">Words</div>
          </div>
        )}
        {item.estimatedReadTime && (
          <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-green-600">{item.estimatedReadTime}</div>
            <div className="text-sm font-medium text-green-700 mt-1">Read Time</div>
          </div>
        )}
      </div>

      {/* Target Keywords */}
      {targetKeywords && targetKeywords.length > 0 && (
        <InfoCard title="Target Keywords">
          <BadgeList items={targetKeywords} colorClass="bg-indigo-100 text-indigo-700" />
        </InfoCard>
      )}

      {/* Content Hooks */}
      {contentHooks && contentHooks.length > 0 && (
        <InfoCard title="Content Hooks">
          <NumberedList items={contentHooks} />
        </InfoCard>
      )}

      {/* Call to Action */}
      {item.callToAction && (
        <InfoCard title="Call to Action">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 font-medium">{item.callToAction}</p>
          </div>
        </InfoCard>
      )}

      {/* Visual Suggestions */}
      {visualSuggestions && visualSuggestions.length > 0 && (
        <InfoCard title="Visual Suggestions">
          <ul className="space-y-2">
            {visualSuggestions.map((v, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-purple-500 mt-0.5">&#9679;</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {/* Related Topics */}
      {relatedTopics && relatedTopics.length > 0 && (
        <InfoCard title="Related Topics">
          <BadgeList items={relatedTopics} colorClass="bg-gray-100 text-gray-700" />
        </InfoCard>
      )}

      {/* SEO Recommendations */}
      {suggestions && suggestions.length > 0 && (
        <InfoCard title="SEO Recommendations">
          <NumberedList items={suggestions} />
        </InfoCard>
      )}
    </div>
  );
};

const NewsletterDetailRenderer = ({ item }) => {
  const altSubjects = safeParseJSON(item.alternativeSubjectLines);
  const sections = safeParseJSON(item.sections);

  if (!item.subject && !altSubjects) return null;

  return (
    <div className="space-y-4">
      {/* Subject Line Card */}
      {item.subject && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="text-xs text-blue-500 font-medium uppercase">Subject Line</div>
          <h3 className="text-xl font-bold text-blue-900 mt-1">{item.subject}</h3>
          {item.preheader && (
            <p className="text-blue-600 text-sm mt-2 italic">{item.preheader}</p>
          )}
        </div>
      )}

      {/* Metadata Badges */}
      <div className="flex flex-wrap gap-2">
        {item.audience && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Audience: {item.audience}</span>}
        {item.frequency && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">{item.frequency}</span>}
        {item.sendTimeSuggestion && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Send: {item.sendTimeSuggestion}</span>}
      </div>

      {/* CTA */}
      {item.callToAction && (
        <InfoCard title="Call to Action">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 font-medium">{item.callToAction}</p>
          </div>
        </InfoCard>
      )}

      {/* Alternative Subject Lines */}
      {altSubjects && altSubjects.length > 0 && (
        <InfoCard title="Alternative Subject Lines">
          <NumberedList items={altSubjects} />
        </InfoCard>
      )}

      {/* Segmentation */}
      {item.segmentationSuggestion && (
        <InfoCard title="Segmentation Suggestion">
          <p className="text-gray-700">{item.segmentationSuggestion}</p>
        </InfoCard>
      )}
    </div>
  );
};

const PressReleaseDetailRenderer = ({ item }) => {
  const quotes = safeParseJSON(item.quotes);
  const targetPubs = safeParseJSON(item.targetPublications);
  const followUpTips = safeParseJSON(item.followUpTips);

  if (!item.headline && !item.dateline && !item.leadParagraph) return null;

  return (
    <div className="space-y-4">
      {/* Headline Block */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-300 rounded-xl p-5">
        {item.headline && <h3 className="text-2xl font-bold text-gray-900">{item.headline}</h3>}
        {item.subheadline && <p className="text-gray-600 text-lg mt-1">{item.subheadline}</p>}
        {item.dateline && (
          <p className="text-sm text-gray-500 mt-3 font-medium uppercase">{item.dateline} -- FOR IMMEDIATE RELEASE</p>
        )}
      </div>

      {/* Lead Paragraph */}
      {item.leadParagraph && (
        <InfoCard title="Lead Paragraph">
          <p className="text-gray-800 leading-relaxed font-medium">{item.leadParagraph}</p>
        </InfoCard>
      )}

      {/* Quotes */}
      {quotes && quotes.length > 0 && (
        <InfoCard title="Quotes">
          <div className="space-y-3">
            {quotes.map((q, i) => (
              <blockquote key={i} className="border-l-4 border-purple-400 pl-4 py-2">
                <p className="text-gray-700 italic">&ldquo;{q.quote}&rdquo;</p>
                {q.speaker && <p className="text-sm text-purple-700 font-semibold mt-1">-- {q.speaker}</p>}
              </blockquote>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Company Boilerplate */}
      {item.boilerplate && (
        <InfoCard title={`About ${item.companyName}`}>
          <p className="text-gray-700">{item.boilerplate}</p>
        </InfoCard>
      )}

      {/* Media Angle */}
      {item.mediaAngle && (
        <InfoCard title="Media Angle">
          <p className="text-gray-700 leading-relaxed">{item.mediaAngle}</p>
        </InfoCard>
      )}

      {/* Target Publications */}
      {targetPubs && targetPubs.length > 0 && (
        <InfoCard title="Target Publications">
          <BadgeList items={targetPubs} colorClass="bg-blue-100 text-blue-700" />
        </InfoCard>
      )}

      {/* Social Media Teaser */}
      {item.socialMediaTeaser && (
        <InfoCard title="Social Media Teaser">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800">{item.socialMediaTeaser}</p>
          </div>
        </InfoCard>
      )}

      {/* Follow-up Tips */}
      {followUpTips && followUpTips.length > 0 && (
        <InfoCard title="Follow-up Tips">
          <NumberedList items={followUpTips} />
        </InfoCard>
      )}
    </div>
  );
};

// --- Renderers for remaining features ---

const BlogDetailRenderer = ({ item }) => {
  if (!item.content) return null;
  return (
    <div className="space-y-4">
      {/* Excerpt Card */}
      {item.excerpt && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <div className="text-xs text-amber-500 font-medium uppercase mb-1">Excerpt</div>
          <p className="text-amber-900 italic leading-relaxed">{item.excerpt}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {item.keywords && item.keywords.split(',').map((kw, i) => (
          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{kw.trim()}</span>
        ))}
        {item.content && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            {item.content.split(/\s+/).length} words
          </span>
        )}
      </div>

      {/* Blog Content */}
      <InfoCard title="Blog Post">
        <AIOutputDisplayInner content={item.content} />
      </InfoCard>
    </div>
  );
};

const MarketingDetailRenderer = ({ item }) => {
  if (!item.content) return null;
  return (
    <div className="space-y-4">
      {/* Headline Banner */}
      {item.headline && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-5 text-center">
          <div className="text-xs text-rose-500 font-medium uppercase mb-1">Headline</div>
          <h3 className="text-2xl font-bold text-rose-900">{item.headline}</h3>
        </div>
      )}

      {/* Target Audience */}
      <div className="flex flex-wrap gap-2">
        {item.product && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Product: {item.product}</span>}
        {item.targetAud && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Audience: {item.targetAud}</span>}
      </div>

      {/* Body Content */}
      <InfoCard title="Marketing Copy">
        <AIOutputDisplayInner content={item.content} />
      </InfoCard>

      {/* CTA */}
      {item.callToAction && (
        <InfoCard title="Call to Action">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-bold text-lg">{item.callToAction}</p>
          </div>
        </InfoCard>
      )}
    </div>
  );
};

const ScriptDetailRenderer = ({ item }) => {
  if (!item.content) return null;
  return (
    <div className="space-y-4">
      {/* Script Info Banner */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4 flex items-center gap-4">
        <div className="text-center flex-1">
          <div className="text-xs text-violet-500 font-medium uppercase">Type</div>
          <div className="text-lg font-bold text-violet-700 capitalize">{item.type}</div>
        </div>
        {item.duration && (
          <div className="text-center flex-1">
            <div className="text-xs text-violet-500 font-medium uppercase">Duration</div>
            <div className="text-lg font-bold text-violet-700">{item.duration} min</div>
          </div>
        )}
      </div>

      {/* Script Content */}
      <InfoCard title="Script">
        <AIOutputDisplayInner content={item.content} />
      </InfoCard>
    </div>
  );
};

const SocialDetailRenderer = ({ item }) => {
  if (!item.content) return null;
  const platformColors = {
    instagram: 'from-pink-50 to-purple-50 border-pink-200',
    twitter: 'from-sky-50 to-blue-50 border-sky-200',
    linkedin: 'from-blue-50 to-indigo-50 border-blue-200',
    facebook: 'from-blue-50 to-indigo-50 border-blue-200',
    tiktok: 'from-gray-50 to-slate-50 border-gray-200',
  };
  const bgClass = platformColors[item.platform] || 'from-gray-50 to-slate-50 border-gray-200';

  return (
    <div className="space-y-4">
      {/* Platform Banner */}
      <div className={`bg-gradient-to-r ${bgClass} rounded-xl p-4 flex items-center gap-3`}>
        <span className="px-3 py-1 bg-white rounded-full text-sm font-bold capitalize shadow-sm">{item.platform}</span>
        <span className="text-gray-500 text-sm">Social Media Post</span>
      </div>

      {/* Post Content */}
      <InfoCard title="Post Content">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{item.content}</p>
      </InfoCard>

      {/* Hashtags */}
      {item.hashtags && (
        <InfoCard title="Hashtags">
          <BadgeList
            items={item.hashtags.split(/\s+/).filter(h => h.startsWith('#'))}
            colorClass="bg-blue-100 text-blue-700"
          />
        </InfoCard>
      )}
    </div>
  );
};

const EmailDetailRenderer = ({ item }) => {
  if (!item.body && !item.subject) return null;
  return (
    <div className="space-y-4">
      {/* Subject Line */}
      {item.subject && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
          <div className="text-xs text-blue-500 font-medium uppercase mb-1">Subject Line</div>
          <h3 className="text-xl font-bold text-blue-900">{item.subject}</h3>
        </div>
      )}

      {/* Email Type Badge */}
      <div className="flex flex-wrap gap-2">
        {item.type && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">{item.type}</span>}
      </div>

      {/* Email Body */}
      {item.body && (
        <InfoCard title="Email Content">
          <AIOutputDisplayInner content={item.body} />
        </InfoCard>
      )}
    </div>
  );
};

const SEODetailRenderer = ({ item }) => {
  if (!item.content) return null;
  return (
    <div className="space-y-4">
      {/* Google Snippet Preview */}
      <InfoCard title="Search Preview">
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-xl">
          <div className="text-blue-700 text-lg font-medium hover:underline cursor-pointer truncate">
            {item.metaTitle || item.title}
          </div>
          <div className="text-green-700 text-sm mt-0.5">https://example.com/{item.keyword?.replace(/\s+/g, '-').toLowerCase()}</div>
          <div className="text-gray-600 text-sm mt-1 line-clamp-2">
            {item.metaDesc || item.content?.slice(0, 160)}
          </div>
        </div>
      </InfoCard>

      {/* Keyword Badge */}
      <div className="flex flex-wrap gap-2">
        {item.keyword && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Target: {item.keyword}</span>}
      </div>

      {/* SEO Content */}
      <InfoCard title="SEO Content">
        <AIOutputDisplayInner content={item.content} />
      </InfoCard>
    </div>
  );
};

const TextDetailRenderer = ({ item }) => {
  if (!item.content) return null;
  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {item.type && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">{item.type}</span>}
        {item.tone && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">{item.tone}</span>}
        {item.wordCount && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{item.wordCount} words</span>}
      </div>

      {/* Content */}
      <InfoCard title="Generated Content">
        <AIOutputDisplayInner content={item.content} />
      </InfoCard>
    </div>
  );
};

const SummaryDetailRenderer = ({ item }) => {
  if (!item.summary) return null;
  return (
    <div className="space-y-4">
      {/* Length Badge */}
      <div className="flex flex-wrap gap-2">
        {item.length && <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium capitalize">{item.length} summary</span>}
      </div>

      {/* Original (collapsible) */}
      {item.originalText && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <span className="transition-transform group-open:rotate-90">&#9654;</span>
            View Original Text
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{item.originalText}</p>
          </div>
        </details>
      )}

      {/* Summary */}
      <InfoCard title="Summary">
        <p className="text-gray-800 leading-relaxed">{item.summary}</p>
      </InfoCard>
    </div>
  );
};

const TranslationDetailRenderer = ({ item }) => {
  if (!item.translatedText) return null;
  const langNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', ru: 'Russian' };
  return (
    <div className="space-y-4">
      {/* Language Flow */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-xs text-cyan-500 font-medium uppercase">From</div>
          <div className="text-lg font-bold text-cyan-700">{langNames[item.sourceLang] || item.sourceLang}</div>
        </div>
        <div className="text-2xl text-cyan-400">&#8594;</div>
        <div className="text-center">
          <div className="text-xs text-blue-500 font-medium uppercase">To</div>
          <div className="text-lg font-bold text-blue-700">{langNames[item.targetLang] || item.targetLang}</div>
        </div>
      </div>

      {/* Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Original">
          <p className="text-gray-700 whitespace-pre-wrap">{item.originalText}</p>
        </InfoCard>
        <InfoCard title="Translation">
          <p className="text-gray-800 whitespace-pre-wrap font-medium">{item.translatedText}</p>
        </InfoCard>
      </div>
    </div>
  );
};

const PodcastDetailRenderer = ({ item }) => {
  if (!item.script && !item.audioUrl) return null;
  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex flex-wrap gap-2">
        {item.duration && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">{item.duration}s duration</span>}
      </div>

      {/* Audio Player */}
      {item.audioUrl && item.audioUrl.startsWith('/uploads') && (
        <InfoCard title="Podcast Audio">
          <audio controls className="w-full" src={item.audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </InfoCard>
      )}

      {/* Script */}
      {item.script && (
        <InfoCard title="Podcast Script">
          <AIOutputDisplayInner content={item.script} />
        </InfoCard>
      )}
    </div>
  );
};

const VideoDetailRenderer = ({ item }) => {
  if (!item.description && !item.videoUrl) return null;
  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {item.style && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">{item.style}</span>}
        {item.resolution && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{item.resolution}</span>}
        {item.duration && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">{item.duration}s</span>}
      </div>

      {/* Video Player */}
      {item.videoUrl && item.videoUrl.startsWith('/uploads') && (
        <div className="bg-black rounded-xl overflow-hidden">
          <video controls className="w-full" src={item.videoUrl} poster={item.thumbnail}>
            Your browser does not support the video element.
          </video>
        </div>
      )}

      {/* Script / Description */}
      {item.description && (
        <InfoCard title="Video Script &amp; Concept">
          <AIOutputDisplayInner content={item.description} />
        </InfoCard>
      )}
    </div>
  );
};

const AudioDetailRenderer = ({ item }) => {
  if (!item.description && !item.audioUrl) return null;
  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {item.voice && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">Voice: {item.voice}</span>}
        {item.language && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium uppercase">{item.language}</span>}
        {item.duration && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{item.duration}s</span>}
      </div>

      {/* Audio Player */}
      {item.audioUrl && item.audioUrl.startsWith('/uploads') && (
        <InfoCard title="Generated Audio">
          <audio controls className="w-full" src={item.audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </InfoCard>
      )}

      {/* Script */}
      {item.description && (
        <InfoCard title="Audio Script">
          <AIOutputDisplayInner content={item.description} />
        </InfoCard>
      )}
    </div>
  );
};

const VoiceoverDetailRenderer = ({ item }) => {
  if (!item.audioUrl && !item.text) return null;
  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {item.voice && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">Voice: {item.voice}</span>}
        {item.language && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium uppercase">{item.language}</span>}
        {item.duration && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{item.duration}s</span>}
      </div>

      {/* Audio Player */}
      {item.audioUrl && item.audioUrl.startsWith('/uploads') && (
        <InfoCard title="Voiceover Audio">
          <audio controls className="w-full" src={item.audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </InfoCard>
      )}

      {/* Original Text */}
      {item.text && (
        <InfoCard title="Voiceover Text">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.text}</p>
        </InfoCard>
      )}
    </div>
  );
};

const MusicDetailRenderer = ({ item }) => {
  if (!item.prompt && !item.audioUrl) return null;
  return (
    <div className="space-y-4">
      {/* Genre/Mood Banner */}
      <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-200 rounded-xl p-4 flex items-center gap-4">
        <div className="text-center flex-1">
          <div className="text-xs text-fuchsia-500 font-medium uppercase">Genre</div>
          <div className="text-lg font-bold text-fuchsia-700 capitalize">{item.genre}</div>
        </div>
        {item.mood && (
          <div className="text-center flex-1">
            <div className="text-xs text-pink-500 font-medium uppercase">Mood</div>
            <div className="text-lg font-bold text-pink-700 capitalize">{item.mood}</div>
          </div>
        )}
        {item.duration && (
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 font-medium uppercase">Duration</div>
            <div className="text-lg font-bold text-gray-700">{Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</div>
          </div>
        )}
      </div>

      {/* Music Description */}
      {item.prompt && (
        <InfoCard title="Music Description">
          <AIOutputDisplayInner content={item.prompt} />
        </InfoCard>
      )}
    </div>
  );
};

const ImageDetailRenderer = ({ item }) => {
  if (!item.imageUrl && !item.description) return null;
  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {item.style && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">{item.style}</span>}
        {item.resolution && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{item.resolution}</span>}
      </div>

      {/* Image Display */}
      {item.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <img src={item.imageUrl} alt={item.title} className="w-full" />
        </div>
      )}

      {/* Prompt / Description */}
      {item.description && item.description !== item.prompt && (
        <InfoCard title="Revised Prompt">
          <p className="text-gray-700 leading-relaxed">{item.description}</p>
        </InfoCard>
      )}
    </div>
  );
};

// Feature renderer dispatch map
const featureDetailRenderers = {
  calendar: CalendarDetailRenderer,
  repurpose: RepurposeDetailRenderer,
  plagiarism: PlagiarismDetailRenderer,
  'image-suggester': ImageSuggesterDetailRenderer,
  performance: PerformanceDetailRenderer,
  'blog-outlines': BlogOutlineDetailRenderer,
  newsletters: NewsletterDetailRenderer,
  'press-releases': PressReleaseDetailRenderer,
  blogs: BlogDetailRenderer,
  marketing: MarketingDetailRenderer,
  scripts: ScriptDetailRenderer,
  social: SocialDetailRenderer,
  emails: EmailDetailRenderer,
  seo: SEODetailRenderer,
  text: TextDetailRenderer,
  summaries: SummaryDetailRenderer,
  translations: TranslationDetailRenderer,
  podcasts: PodcastDetailRenderer,
  videos: VideoDetailRenderer,
  audio: AudioDetailRenderer,
  voiceovers: VoiceoverDetailRenderer,
  music: MusicDetailRenderer,
  images: ImageDetailRenderer,
};

// Inner markdown renderer (used by both AIOutputDisplay and RepurposeDetailRenderer)
const AIOutputDisplayInner = ({ content }) => {
  if (!content) return null;
  const isMarkdown = content.includes('##') || content.includes('**') || content.includes('- ');
  if (isMarkdown) {
    const lines = content.split('\n');
    return (
      <div className="prose prose-sm max-w-none">
        {lines.map((line, i) => {
          if (line.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.replace('## ', '')}</h2>;
          } else if (line.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-semibold text-gray-800 mt-3 mb-2">{line.replace('### ', '')}</h3>;
          } else if (line.startsWith('#### ')) {
            return <h4 key={i} className="text-md font-semibold text-gray-700 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
          } else if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="font-bold text-gray-800 my-1">{line.replace(/\*\*/g, '')}</p>;
          } else if (line.startsWith('- ')) {
            return <li key={i} className="text-gray-700 ml-4">{line.replace('- ', '')}</li>;
          } else if (line.startsWith('> ')) {
            return <blockquote key={i} className="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-2">{line.replace('> ', '')}</blockquote>;
          } else if (line.startsWith('```')) {
            return null;
          } else if (line.trim() === '---') {
            return <hr key={i} className="my-4 border-gray-200" />;
          } else if (line.trim()) {
            return <p key={i} className="text-gray-700 my-1">{line}</p>;
          }
          return null;
        })}
      </div>
    );
  }
  return <p className="text-gray-700 whitespace-pre-wrap">{content}</p>;
};

// Component to render AI output beautifully
const AIOutputDisplay = ({ content, type }) => {
  if (!content) return null;

  // Check if it looks like markdown
  const isMarkdown = content.includes('##') || content.includes('**') || content.includes('- ');

  if (isMarkdown) {
    // Simple markdown rendering
    const lines = content.split('\n');
    return (
      <div className="prose prose-sm max-w-none">
        {lines.map((line, i) => {
          if (line.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.replace('## ', '')}</h2>;
          } else if (line.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-semibold text-gray-800 mt-3 mb-2">{line.replace('### ', '')}</h3>;
          } else if (line.startsWith('#### ')) {
            return <h4 key={i} className="text-md font-semibold text-gray-700 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
          } else if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="font-bold text-gray-800 my-1">{line.replace(/\*\*/g, '')}</p>;
          } else if (line.startsWith('- ')) {
            return <li key={i} className="text-gray-700 ml-4">{line.replace('- ', '')}</li>;
          } else if (line.startsWith('> ')) {
            return <blockquote key={i} className="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-2">{line.replace('> ', '')}</blockquote>;
          } else if (line.startsWith('```')) {
            return null; // Skip code fence markers
          } else if (line.trim() === '---') {
            return <hr key={i} className="my-4 border-gray-200" />;
          } else if (line.trim()) {
            return <p key={i} className="text-gray-700 my-1">{line}</p>;
          }
          return null;
        })}
      </div>
    );
  }

  return <p className="text-gray-700 whitespace-pre-wrap">{content}</p>;
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
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Bulk operations
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState('');

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const featureApi = apiMap[feature];
  const formFields = formFieldsMap[feature] || [];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit, sortBy, sortOrder };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      const res = await featureApi.getAll(params);
      if (res.data.items) {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || res.data.items.length);
      } else {
        setItems(Array.isArray(res.data) ? res.data : []);
        setTotalPages(1);
        setTotalItems(Array.isArray(res.data) ? res.data.length : 0);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [feature, currentPage, sortBy, sortOrder, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSearchQuery('');
    setStatusFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  }, [feature]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await featureApi.create(formData);
      setShowModal(false);
      setFormData({});
      fetchItems();
      toast.success('Created successfully!');
    } catch (error) {
      toast.error('Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await featureApi.update(selectedItem.id, editData);
      setItems(items.map(item => item.id === selectedItem.id ? res.data : item));
      setSelectedItem(res.data);
      setEditMode(false);
      toast.success('Updated successfully!');
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (id) => {
    setGenerating(id);
    setItems(items.map(item => item.id === id ? { ...item, status: 'processing' } : item));
    toast.loading('Generating with AI...', { id: 'generate-' + id });
    try {
      const res = await featureApi.generate(id);
      setItems(items.map(item => item.id === id ? res.data : item));
      if (selectedItem?.id === id) {
        setSelectedItem(res.data);
      }
      toast.success('Generated successfully!', { id: 'generate-' + id });
    } catch (error) {
      toast.error('Generation failed: ' + (error.response?.data?.error || error.message), { id: 'generate-' + id });
      setItems(items.map(item => item.id === id ? { ...item, status: 'failed' } : item));
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      open: true,
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await featureApi.delete(id);
          setItems(items.filter(item => item.id !== id));
          setTotalItems(prev => prev - 1);
          toast.success('Deleted successfully!');
        } catch (error) {
          toast.error('Failed to delete');
        }
        setConfirmModal({ open: false });
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      open: true,
      title: 'Delete Selected Items',
      message: `Are you sure you want to delete ${selectedIds.size} selected items?`,
      onConfirm: async () => {
        try {
          await featureApi.bulkDelete(Array.from(selectedIds));
          setSelectedIds(new Set());
          fetchItems();
          toast.success(`${selectedIds.size} items deleted`);
        } catch (error) {
          toast.error('Bulk delete failed');
        }
        setConfirmModal({ open: false });
      }
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0 || !bulkStatusValue) return;
    try {
      await featureApi.bulkUpdate(Array.from(selectedIds), { status: bulkStatusValue });
      setSelectedIds(new Set());
      setBulkStatusValue('');
      fetchItems();
      toast.success(`${selectedIds.size} items updated`);
    } catch (error) {
      toast.error('Bulk update failed');
    }
  };

  const handleExportCsv = async () => {
    try {
      toast.loading('Exporting CSV...', { id: 'export-csv' });
      const res = await featureApi.exportCsv({ search: searchQuery, status: statusFilter });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${feature}-export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported!', { id: 'export-csv' });
    } catch (error) {
      toast.error('Export failed', { id: 'export-csv' });
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.loading('Exporting PDF...', { id: 'export-pdf' });
      const res = await featureApi.exportPdf({ search: searchQuery, status: statusFilter });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${feature}-export.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported!', { id: 'export-pdf' });
    } catch (error) {
      toast.error('Export failed', { id: 'export-pdf' });
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setEditMode(false);
    setShowDetailModal(true);
  };

  const handleStartEdit = () => {
    const data = {};
    formFields.forEach(f => { data[f.name] = selectedItem[f.name] || ''; });
    setEditData(data);
    setEditMode(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <FiChevronDown size={14} className="text-gray-300" />;
    return sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getMainContent = (item) => {
    return item.content || item.aiSuggestions || item.repurposedContent ||
           item.analysisReport || item.suggestions || item.analysisDetails ||
           item.outline || item.subject || item.headline || null;
  };

  const getScoreDisplay = (item) => {
    if (item.originalityScore !== undefined) {
      return (
        <div className="flex gap-4 my-4">
          <div className="flex-1 bg-green-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{item.originalityScore}%</div>
            <div className="text-sm text-green-700">Originality Score</div>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{item.plagiarismScore}%</div>
            <div className="text-sm text-red-700">Plagiarism Risk</div>
          </div>
        </div>
      );
    }
    if (item.predictedScore !== undefined) {
      return (
        <div className="flex gap-4 my-4">
          <div className="flex-1 bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{item.predictedScore}/100</div>
            <div className="text-sm text-blue-700">Performance Score</div>
          </div>
          <div className="flex-1 bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{item.viralityScore}/100</div>
            <div className="text-sm text-purple-700">Virality Potential</div>
          </div>
        </div>
      );
    }
    if (item.seoScore !== undefined) {
      return (
        <div className="flex gap-4 my-4">
          <div className="flex-1 bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{item.seoScore}/100</div>
            <div className="text-sm text-indigo-700">SEO Score</div>
          </div>
          <div className="flex-1 bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-cyan-600">{item.estimatedLength}</div>
            <div className="text-sm text-cyan-700">Est. Words</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">{totalItems} items</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            title="Export CSV"
          >
            <FiDownload size={16} /> CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            title="Export PDF"
          >
            <FiDownload size={16} /> PDF
          </button>
          <button
            onClick={() => { setShowModal(true); setFormData({}); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <FiPlus size={20} />
            Create New
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-700">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Selected
          </button>
          <select
            value={bulkStatusValue}
            onChange={(e) => setBulkStatusValue(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          >
            <option value="">Change Status...</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          {bulkStatusValue && (
            <button
              onClick={handleBulkStatusUpdate}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply
            </button>
          )}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} columns={4} />
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">{searchQuery || statusFilter ? 'No items match your filters.' : 'No items yet. Create your first one!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('title')}
                  >
                    <span className="flex items-center gap-1">Title <SortIcon column="title" /></span>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    <span className="flex items-center gap-1">Status <SortIcon column="status" /></span>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span className="flex items-center gap-1">Created <SortIcon column="createdAt" /></span>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.has(item.id) ? 'bg-primary-50' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.prompt || item.originalText || item.topic || item.keyword || item.product || item.text || item.content || item.announcement || item.originalContent || '-'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} ({totalItems} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Create New {title.replace(/s$/, '').replace('AI ', '')}</h2>
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
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      required={field.required}
                    />
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
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
                <StatusBadge status={selectedItem.status} />
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setEditMode(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Edit Mode */}
              {editMode ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <FiEdit2 className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-blue-700">Edit Mode</span>
                  </div>
                  {formFields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={editData[field.name] || ''}
                          onChange={(e) => setEditData({ ...editData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          rows={4}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={editData[field.name] || ''}
                          onChange={(e) => setEditData({ ...editData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={editData[field.name] || ''}
                          onChange={(e) => setEditData({ ...editData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={editData[field.name] || ''}
                          onChange={(e) => setEditData({ ...editData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FiSave size={16} />
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Feature-Specific Professional Renderer */}
                  {(() => {
                    const FeatureRenderer = featureDetailRenderers[feature];
                    if (FeatureRenderer && selectedItem.status === 'completed') {
                      return <FeatureRenderer item={selectedItem} />;
                    }
                    return null;
                  })()}

                  {/* Generic fallback: Score Display */}
                  {!featureDetailRenderers[feature] && getScoreDisplay(selectedItem)}

                  {/* Video/Audio Player */}
                  {selectedItem.videoUrl && selectedItem.videoUrl.startsWith('/uploads') && (
                    <div className="bg-black rounded-lg overflow-hidden">
                      <video controls className="w-full" src={selectedItem.videoUrl}>
                        Your browser does not support the video element.
                      </video>
                    </div>
                  )}
                  {selectedItem.audioUrl && selectedItem.audioUrl.startsWith('/uploads') && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
                      <label className="text-sm text-purple-600 font-medium block mb-2">Generated Audio</label>
                      <audio controls className="w-full" src={selectedItem.audioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  {selectedItem.imageUrl && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Generated Image</label>
                      <img src={selectedItem.imageUrl} alt={selectedItem.title} className="rounded-lg max-w-full" />
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

                  {/* Input Content */}
                  {(selectedItem.prompt || selectedItem.originalText || selectedItem.topic || selectedItem.content || selectedItem.originalContent || selectedItem.announcement) && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Input</label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedItem.prompt || selectedItem.originalText || selectedItem.topic ||
                           (feature === 'plagiarism' || feature === 'image-suggester' || feature === 'performance' ? selectedItem.content : null) ||
                           selectedItem.originalContent || selectedItem.announcement}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Generated Content */}
                  {getMainContent(selectedItem) && (
                    <details className={featureDetailRenderers[feature] && selectedItem.status === 'completed' ? 'group' : ''} open={!featureDetailRenderers[feature] || selectedItem.status !== 'completed'}>
                      <summary className={`cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2 ${featureDetailRenderers[feature] && selectedItem.status === 'completed' ? '' : 'hidden'}`}>
                        <span className="transition-transform group-open:rotate-90">&#9654;</span>
                        View Full AI Output
                      </summary>
                      <div className="mt-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <AIOutputDisplay content={getMainContent(selectedItem)} type={feature} />
                      </div>
                    </details>
                  )}

                  {/* Translated Text */}
                  {selectedItem.translatedText && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Translation</label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.translatedText}</p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedItem.summary && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Summary</label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Script */}
                  {selectedItem.script && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Script</label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.script}</p>
                      </div>
                    </div>
                  )}

                  {/* Email Body */}
                  {selectedItem.body && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Email Content</label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.body}</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {selectedItem.style && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Style: {selectedItem.style}</span>}
                    {selectedItem.voice && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Voice: {selectedItem.voice}</span>}
                    {selectedItem.language && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Language: {selectedItem.language}</span>}
                    {selectedItem.platform && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Platform: {selectedItem.platform}</span>}
                    {selectedItem.contentType && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Type: {selectedItem.contentType}</span>}
                    {selectedItem.genre && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Genre: {selectedItem.genre}</span>}
                    {selectedItem.mood && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Mood: {selectedItem.mood}</span>}
                    {selectedItem.targetMedia && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Target: {selectedItem.targetMedia}</span>}
                    {selectedItem.frequency && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Frequency: {selectedItem.frequency}</span>}
                    {selectedItem.scheduledDate && !featureDetailRenderers[feature] && <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">Scheduled: {new Date(selectedItem.scheduledDate).toLocaleDateString()}</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleStartEdit}
                      className="px-4 py-3 border border-blue-200 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEdit2 size={18} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleGenerate(selectedItem.id)}
                      disabled={generating === selectedItem.id}
                      className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {generating === selectedItem.id ? (
                        <FiLoader className="animate-spin" size={18} />
                      ) : (
                        <FiPlay size={18} />
                      )}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false })}
      />
    </div>
  );
}
