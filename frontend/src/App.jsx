import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
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
      </Route>
    </Routes>
  );
}

export default App;
