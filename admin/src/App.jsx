import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import CourseList from './pages/CourseList';
import CourseForm from './pages/CourseForm';
import PostList from './pages/PostList';
import LessonManager from './pages/LessonManager';
import UserList from './pages/UserList';
import OrderList from './pages/OrderList';
import CategoryList from './pages/CategoryList';
import Inquiries from './pages/Inquiries';
import QA from './pages/QA';
import Registrations from './pages/Registrations';
import RecruitmentAdmin from './pages/RecruitmentAdmin';
import Submissions from './pages/Submissions';
import Login from './pages/Login';
import useAuthStore from './store/authStore';
import { useSecurityProtection } from './lib/useSecurityProtection';
import { useIdleLogout } from './lib/useIdleLogout';
import Loading from './components/Loading';
import './index.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PostForm = lazy(() => import('./pages/PostForm'));
const HomeEditor = lazy(() => import('./pages/HomeEditor'));
const Settings = lazy(() => import('./pages/Settings'));
const MediaManager = lazy(() => import('./pages/MediaManager'));

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin' && user?.role !== 'editor' && user?.role !== 'staff') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminOnlyRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function LazyPage({ children }) {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}><Loading /></div>}>
      {children}
    </Suspense>
  );
}

export default function App() {
  useSecurityProtection();
  useIdleLogout();
  return (
    <BrowserRouter basename={basename}>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<LazyPage><Dashboard /></LazyPage>} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/new" element={<CourseForm />} />
          <Route path="courses/edit/:id" element={<CourseForm />} />
          <Route path="courses/:id/lessons" element={<LessonManager />} />
          <Route path="posts" element={<PostList />} />
          <Route path="posts/new" element={<LazyPage><PostForm /></LazyPage>} />
          <Route path="posts/edit/:id" element={<LazyPage><PostForm /></LazyPage>} />
          <Route path="users" element={<UserList />} />
          <Route path="orders" element={<AdminOnlyRoute><OrderList /></AdminOnlyRoute>} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="home-cms" element={<LazyPage><HomeEditor /></LazyPage>} />
          <Route path="settings" element={<AdminOnlyRoute><LazyPage><Settings /></LazyPage></AdminOnlyRoute>} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="qa" element={<QA />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="recruitment" element={<RecruitmentAdmin />} />
          <Route path="media" element={<LazyPage><MediaManager /></LazyPage>} />
          <Route path="submissions" element={<Submissions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
