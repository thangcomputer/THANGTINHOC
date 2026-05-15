import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useAuthStore from './store/authStore';
import api from './lib/api';

// Layout & Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PromotionPopup from './components/PromotionPopup';
import ChatWidget from './components/ChatWidget';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/PageLoader';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import MyCourses from './pages/MyCourses';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Recruitment from './pages/Recruitment';
import Contact from './pages/Contact';
import MyActivity from './pages/MyActivity';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Layout with Navbar + Footer — uses Outlet for child routes
function LayoutWrapper() {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    api.get('/settings').then(res => {
      const data = res.data.data;
      setSettings(data);
      if (data?.google_analytics_id && !document.getElementById('ga-script')) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${data.google_analytics_id}`;
        document.head.appendChild(script);
        const inline = document.createElement('script');
        inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.google_analytics_id}');`;
        document.head.appendChild(inline);
      }
      if (data?.site_name) document.title = data.site_name + ' - Trung Tâm Đào Tạo Tin Học';
      if (data?.site_description) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
        meta.content = data.site_description;
      }
    }).catch(err => console.error('Failed to fetch settings:', err))
      .finally(() => setTimeout(() => setSettingsLoading(false), 600));
  }, []);

  useEffect(() => {
    if (settings?.google_analytics_id && window.gtag) {
      window.gtag('config', settings.google_analytics_id, { page_path: location.pathname + location.search });
    }
  }, [location, settings]);

  if (settingsLoading) {
    return <PageLoader mode={settings?.loading_mode || 'spinner'} siteName={settings?.site_name || 'Thắng Tin Học'} logo={settings?.site_logo} />;
  }

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" containerStyle={{ zIndex: 999999 }} toastOptions={{ style: { zIndex: 999999 } }} />
      <Navbar settings={settings} />
      <main style={{ flex: 1, paddingTop: '100px', minHeight: 'calc(100vh - 300px)' }}>
        <Outlet context={{ settings }} />
      </main>
      <PromotionPopup enabled={settings?.promo_enabled} content={settings?.promo_text} />
      <ChatWidget settings={settings} />
      <CookieConsent />
      <Footer settings={settings} />
    </>
  );
}

// Home needs settings from context
function HomeWrapper() {
  const { settings } = useOutletContext();
  return <Home settings={settings} />;
}

const router = createBrowserRouter([
  // Auth routes — no layout
  { path: '/login', element: <><Toaster position="top-right" /><Login /></> },
  { path: '/register', element: <><Toaster position="top-right" /><Register /></> },
  { path: '/forgot-password', element: <><Toaster position="top-right" /><ForgotPassword /></> },
  { path: '/reset-password', element: <><Toaster position="top-right" /><ResetPassword /></> },
  { path: '/learn/:slug', element: <><Toaster position="top-right" /><PrivateRoute><CoursePlayer /></PrivateRoute></> },
  { path: '/learn/:slug/:lessonId', element: <><Toaster position="top-right" /><PrivateRoute><CoursePlayer /></PrivateRoute></> },

  // Main layout — all routes share Navbar+Footer via LayoutWrapper
  {
    path: '/',
    element: <LayoutWrapper />,
    children: [
      { index: true, element: <HomeWrapper /> },
      { path: 'gioi-thieu', element: <About /> },
      { path: 'courses', element: <Courses /> },
      { path: 'courses/:slug', element: <CourseDetail /> },
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogDetail /> },
      { path: 'tuyen-dung', element: <Recruitment /> },
      { path: 'lien-he', element: <Contact /> },
      { path: 'my-courses', element: <PrivateRoute><MyCourses /></PrivateRoute> },
      { path: 'my-activity', element: <PrivateRoute><MyActivity /></PrivateRoute> },
      { path: 'profile', element: <PrivateRoute><Profile /></PrivateRoute> },
      { path: 'checkout', element: <PrivateRoute><Checkout /></PrivateRoute> },
      { path: 'payment/success', element: <PrivateRoute><PaymentSuccess /></PrivateRoute> },
      { path: 'ghi-danh', element: <Navigate to="/?enroll=true" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <><Toaster position="top-right" /><NotFound /></> },
]);

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
