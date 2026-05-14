import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import Profile from './pages/Profile';
import AdvancedSuite from './pages/AdvancedSuite';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfAiDrivenContentBriefGeneration from './pages/CfAiDrivenContentBriefGeneration';
import CfAutomatedABTesting from './pages/CfAutomatedABTesting';
import CfPredictiveContentRoiScoring from './pages/CfPredictiveContentRoiScoring';
import CfWhiteLabelSaasReady from './pages/CfWhiteLabelSaasReady';
import CfInfluencerOutreachAutomation from './pages/CfInfluencerOutreachAutomation';
import GapAllContentRoutesLackDedicatedAiGenerationEndpointsMi from './pages/GapAllContentRoutesLackDedicatedAiGenerationEndpointsMi';
import GapNoTeamCollaborationOrGranularPermissionManagement from './pages/GapNoTeamCollaborationOrGranularPermissionManagement';
import GapNoApprovalWorkflow from './pages/GapNoApprovalWorkflow';
import GapNoRealTimePublishingIntegrationsWordpressWebflowMediu from './pages/GapNoRealTimePublishingIntegrationsWordpressWebflowMediu';
import GapNoCrossPlatformPublishedContentAnalyticsAggregation from './pages/GapNoCrossPlatformPublishedContentAnalyticsAggregation';
import GapNoPaymentBillingModule from './pages/GapNoPaymentBillingModule';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" state={{ from: location }} />;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="advanced" element={<AdvancedSuite />} />
          {/* Existing Features */}
          <Route path="videos" element={<FeaturePage feature="videos" title="Video Generation" />} />
          <Route path="audio" element={<FeaturePage feature="audio" title="Audio Generation" />} />
          <Route path="text" element={<FeaturePage feature="text" title="Text Content" />} />
          <Route path="images" element={<FeaturePage feature="images" title="Image Generation" />} />
          <Route path="translations" element={<FeaturePage feature="translations" title="Translations" />} />
          <Route path="summaries" element={<FeaturePage feature="summaries" title="Summaries" />} />
          <Route path="seo" element={<FeaturePage feature="seo" title="SEO Content" />} />
          <Route path="social" element={<FeaturePage feature="social" title="Social Media Posts" />} />
          <Route path="emails" element={<FeaturePage feature="emails" title="Email Content" />} />
          <Route path="blogs" element={<FeaturePage feature="blogs" title="Blog Posts" />} />
          <Route path="marketing" element={<FeaturePage feature="marketing" title="Marketing Copy" />} />
          <Route path="scripts" element={<FeaturePage feature="scripts" title="Scripts" />} />
          <Route path="podcasts" element={<FeaturePage feature="podcasts" title="Podcasts" />} />
          <Route path="voiceovers" element={<FeaturePage feature="voiceovers" title="Voiceovers" />} />
          <Route path="music" element={<FeaturePage feature="music" title="Music Generation" />} />
          {/* NEW AI Content Studio Features */}
          <Route path="calendar" element={<FeaturePage feature="calendar" title="AI Content Calendar" />} />
          <Route path="repurpose" element={<FeaturePage feature="repurpose" title="AI Repurposer" />} />
          <Route path="plagiarism" element={<FeaturePage feature="plagiarism" title="AI Plagiarism Checker" />} />
          <Route path="image-suggester" element={<FeaturePage feature="image-suggester" title="AI Image Suggester" />} />
          <Route path="performance" element={<FeaturePage feature="performance" title="AI Performance Predictor" />} />
          <Route path="blog-outlines" element={<FeaturePage feature="blog-outlines" title="AI Blog Outline Creator" />} />
          <Route path="newsletters" element={<FeaturePage feature="newsletters" title="AI Newsletter Writer" />} />
          <Route path="press-releases" element={<FeaturePage feature="press-releases" title="AI Press Release Writer" />} />
        </Route>
      
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/ai-driven-content-brief-generation" element={<CfAiDrivenContentBriefGeneration />} />
        <Route path="/cf/automated-a-b-testing" element={<CfAutomatedABTesting />} />
        <Route path="/cf/predictive-content-roi-scoring" element={<CfPredictiveContentRoiScoring />} />
        <Route path="/cf/white-label-saas-ready" element={<CfWhiteLabelSaasReady />} />
        <Route path="/cf/influencer-outreach-automation" element={<CfInfluencerOutreachAutomation />} />
        <Route path="/gap/all-content-routes-lack-dedicated-ai-generation-endpoints-mi" element={<GapAllContentRoutesLackDedicatedAiGenerationEndpointsMi />} />
        <Route path="/gap/no-team-collaboration-or-granular-permission-management" element={<GapNoTeamCollaborationOrGranularPermissionManagement />} />
        <Route path="/gap/no-approval-workflow" element={<GapNoApprovalWorkflow />} />
        <Route path="/gap/no-real-time-publishing-integrations-wordpress-webflow-mediu" element={<GapNoRealTimePublishingIntegrationsWordpressWebflowMediu />} />
        <Route path="/gap/no-cross-platform-published-content-analytics-aggregation" element={<GapNoCrossPlatformPublishedContentAnalyticsAggregation />} />
        <Route path="/gap/no-payment-billing-module" element={<GapNoPaymentBillingModule />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
