import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import './Checkout.css';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const allowMock = import.meta.env.VITE_ALLOW_MOCK_PAYMENT === 'true' || import.meta.env.DEV;

const paymentMethods = [
  ...(allowMock ? [{ id: 'mock', label: 'Thanh Toán Demo', desc: 'Thanh toán tức thì (chế độ demo)', icon: '💳' }] : []),
  { id: 'vnpay', label: 'VNPay', desc: 'ATM / Internet Banking (Sắp ra mắt)', icon: '🏦', disabled: true },
  { id: 'momo', label: 'Ví MoMo', desc: 'Thanh toán qua ví MoMo (Sắp ra mắt)', icon: '📱', disabled: true },
];

export default function Checkout() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses] = useState(location.state?.courses || []);
  const [method, setMethod] = useState(allowMock ? 'mock' : 'vnpay');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (!courses.length) navigate('/courses');
  }, []);

  const total = courses.reduce((s, c) => s + c.price, 0);
  const canCheckout = allowMock && method === 'mock';

  const handleCheckout = async () => {
    if (!canCheckout) {
      toast.error('Cổng thanh toán đang được tích hợp. Vui lòng liên hệ trung tâm.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        courseIds: courses.map(c => c.id),
        paymentMethod: method,
      });
      navigate('/payment/success', { state: { courses, order: res.data.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!courses.length) return null;

  return (
    <div className="checkout-page">
      <div className="page-header">
        <div className="page-header-bg" />
        <div className="container page-header-content">
          <div className="section-tag"><CreditCard size={14} /> Thanh Toán</div>
          <h1 className="page-title">Xác Nhận <span className="highlight">Đặt Hàng</span></h1>
        </div>
      </div>

      <div className="container checkout-body">
        <div className="checkout-grid">
          {/* Left: Payment methods */}
          <div className="checkout-left">
            <div className="checkout-section">
              <h3>Thông Tin Người Mua</h3>
              <div className="buyer-info">
                <p><strong>{user?.fullName}</strong></p>
                <p>{user?.email}</p>
              </div>
            </div>

            <div className="checkout-section">
              <h3>Phương Thức Thanh Toán</h3>
              <div className="payment-methods">
                {paymentMethods.map(m => (
                  <button
                    key={m.id}
                    className={`payment-method ${method === m.id ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                    onClick={() => !m.disabled && setMethod(m.id)}
                    disabled={m.disabled}
                  >
                    <span className="pm-icon">{m.icon}</span>
                    <div className="pm-info">
                      <p className="pm-label">{m.label}</p>
                      <p className="pm-desc">{m.desc}</p>
                    </div>
                    {method === m.id && <CheckCircle size={18} color="#10b981" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="checkout-right">
            <div className="checkout-section sticky-sidebar">
              <h3>Tóm Tắt Đơn Hàng</h3>
              <div className="order-items">
                {courses.map(c => (
                  <div key={c.id} className="order-item">
                    <p className="order-item-title">{c.title}</p>
                    <p className="order-item-price">{formatPrice(c.price)}</p>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <span>Tổng Cộng</span>
                <span className="price">{formatPrice(total)}</span>
              </div>

              <div className="checkout-trust">
                <ShieldCheck size={16} color="#10b981" />
                <p>Bảo mật thanh toán SSL. Hoàn tiền 100% trong 7 ngày.</p>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleCheckout}
                disabled={loading || !canCheckout}
              >
                {loading ? 'Đang xử lý...' : `Thanh Toán ${formatPrice(total)}`}
              </button>

              <Link to="/courses" className="btn btn-ghost" style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}>
                <ArrowLeft size={16} /> Tiếp Tục Mua
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
