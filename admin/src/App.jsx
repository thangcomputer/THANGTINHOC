import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MediaManager from './pages/MediaManager';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseForm from './pages/CourseForm';
import PostList from './pages/PostList';
import PostForm from './pages/PostForm';
import LessonManager from './pages/LessonManager';
import UserList from './pages/UserList';
import OrderList from './pages/OrderList';
import CategoryList from './pages/CategoryList';
import HomeEditor from './pages/HomeEditor';
import Settings from './pages/Settings';
import Inquiries from './pages/Inquiries';
import QA from './pages/QA';
import Registrations from './pages/Registrations';
import RecruitmentAdmin from './pages/RecruitmentAdmin';
import Submissions from './pages/Submissions';
import Login from './pages/Login';
import useAuthStore from './store/authStore';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/new" element={<CourseForm />} />
          <Route path="courses/edit/:id" element={<CourseForm />} />
          <Route path="courses/:id/lessons" element={<LessonManager />} />
          <Route path="posts" element={<PostList />} />
          <Route path="posts/new" element={<PostForm />} />
          <Route path="posts/edit/:id" element={<PostForm />} />
          <Route path="users" element={<UserList />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="home-cms" element={<HomeEditor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="qa" element={<QA />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="recruitment" element={<RecruitmentAdmin />} />
          <Route path="media" element={<MediaManager />} />
          <Route path="submissions" element={<Submissions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
