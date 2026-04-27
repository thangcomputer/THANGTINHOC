import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../lib/api';
import Loading from '../components/Loading';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-md)',
      fontSize: '0.85rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color, fontWeight: 600 }}>
          {isCurrency 
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)
            : entry.value
          }
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/dashboard').then(res => {
      const apiData = res.data.data;
      if (apiData.monthlyRevenue?.length > 0) {
        apiData.monthlyRevenue = apiData.monthlyRevenue.map(item => {
          const [year, month] = item.month.split('-');
          return { name: `T${parseInt(month)}/${year.slice(2)}`, revenue: item.amount };
        });
      } else {
        apiData.monthlyRevenue = [
          { name: 'T1', revenue: 0 },
          { name: 'T2', revenue: 0 },
          { name: 'T3', revenue: 0 },
        ];
      }
      setData(apiData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading fullPage message="Đang tải bảng điều khiển..." />;
  if (!data) return <div style={{ padding: '3rem', textAlign: 'center' }}>Lỗi tải dữ liệu.</div>;

  const { stats, recentOrders, categoryRatio, topCourses, monthlyRevenue } = data;

  const statCards = [
    { 
      title: 'Tổng Học Viên', 
      value: stats.totalUsers, 
      icon: Users, 
      bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', 
      iconColor: '#6366f1',
      trend: '+12%', 
      trendUp: true 
    },
    { 
      title: 'Khóa Học', 
      value: stats.totalCourses, 
      icon: BookOpen, 
      bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
      iconColor: '#059669',
      trend: '+3', 
      trendUp: true 
    },
    { 
      title: 'Bài Viết', 
      value: stats.totalPosts, 
      icon: FileText, 
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
      iconColor: '#d97706' 
    },
    { 
      title: 'Doanh Thu', 
      value: new Intl.NumberFormat('vi-VN').format(stats.totalRevenue) + 'đ', 
      icon: TrendingUp, 
      bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
      iconColor: '#dc2626' 
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Tổng Quan Hệ Thống</h1>
          <p>Chào mừng trở lại! Đây là số liệu thống kê mới nhất.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s, i) => {
          const IconComp = s.icon;
          return (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.iconColor }}>
                <IconComp size={22} />
              </div>
              <div className="stat-info">
                <p className="stat-title">{s.title}</p>
                <span className="stat-value">{s.value}</span>
              </div>
              {s.trend && (
                <div style={{ 
                  marginLeft: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '2px',
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: s.trendUp ? 'var(--success)' : 'var(--danger)',
                  background: s.trendUp ? 'var(--success-bg)' : 'var(--danger-bg)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  {s.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.trend}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Doanh Thu 6 Tháng Gần Nhất</h3>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={v => v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}K` : v}
                />
                <Tooltip content={<CustomTooltip isCurrency />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#gradientRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Phân Bổ Danh Mục</h3>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categoryRatio.length ? categoryRatio : [{ name: 'Trống', value: 1 }]} 
                  cx="50%" cy="45%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={4} 
                  dataKey="value"
                  strokeWidth={0}
                >
                  {(categoryRatio.length ? categoryRatio : [{ name: 'Trống', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={40} 
                  iconType="circle" 
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Courses */}
      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Đơn Hàng Gần Đây</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có đơn hàng nào</td></tr>
                ) : recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <code style={{ 
                        color: 'var(--primary)', 
                        fontWeight: 700,
                        background: 'var(--primary-50)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}>#{order.orderCode}</code>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.user?.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </td>
                    <td>
                      {order.status === 'paid' ? <span className="status-pill pill-success">Đã thanh toán</span>
                      : order.status === 'pending' ? <span className="status-pill pill-warning">Chờ xử lý</span>
                      : <span className="status-pill pill-danger">Đã hủy</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Khóa Học</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khóa Học</th>
                  <th>Học Viên</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu</td></tr>
                ) : topCourses.map(course => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '36px', height: '28px', 
                          background: 'var(--bg-subtle)', 
                          borderRadius: '4px', 
                          overflow: 'hidden', 
                          flexShrink: 0,
                          border: '1px solid var(--border-light)',
                        }}>
                          {course.thumbnail && <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {course.title.length > 28 ? course.title.substring(0, 28) + '...' : course.title}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        <Users size={11} /> {course.totalStudents}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
