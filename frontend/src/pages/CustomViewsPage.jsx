import ContentCalendar from '../components/ContentCalendar';
import EngagementChart from '../components/EngagementChart';
import ContentBriefPDF from '../components/ContentBriefPDF';
import SEOKeywordTool from '../components/SEOKeywordTool';

export default function CustomViewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Studio Views</h1>
        <p className="text-gray-500 mt-1">
          Custom dashboards and tools for content marketing operations.
        </p>
      </div>

      {/* Top row: two viz */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ContentCalendar />
        <EngagementChart />
      </div>

      {/* Bottom row: two non-viz */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ContentBriefPDF />
        <SEOKeywordTool />
      </div>
    </div>
  );
}
