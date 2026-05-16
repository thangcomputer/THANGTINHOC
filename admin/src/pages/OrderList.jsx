import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, Trash2, ShieldCheck, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { usePagedList } from '../hooks/usePagedList';
import { useConfirm } from '../components/ConfirmProvider';
import { downloadCsv } from '../lib/exportCsv';

export default function OrderList() {
  const confirm = useConfirm();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get(`/orders?status=${status}&limit=500`).then(res => {
      setOrders(res.data.data || []);
    }).catch(() => {
      toast.error('Không tải được đơn hàng');
      setOrders([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [status]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch { toast.error('Lỗi khi cập nhật'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa đơn hàng',
      message: 'Hành động không thể hoàn tác. Tiếp tục?',
      danger: true,
      confirmLabel: 'Xóa',
    });
    if (!ok) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Đã xóa đơn hàng');
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại');
    }
  }
  

  const handleGrantAccess = async (id) => {
    const ok = await confirm({
      title: 'Cấp quyền khóa học',
      message: 'Gán quyền truy cập khóa học cho đơn hàng này?',
      confirmLabel: 'Cấp quyền',
    });
    if (!ok) return;
    try {
      await api.post(`/orders/${id}/grant`);
      toast.success('Đã cấp quyền truy cập khóa học');
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cấp quyền thất bại');
    }
  }

  const { items: pagedOrders, page, setPage, total, totalPages } = usePagedList(orders, {
    pageSize: 15,
    search,
    searchFn: (o, q) =>
      (o.orderCode || '').toLowerCase().includes(q) ||
      (o.user?.fullName || '').toLowerCase().includes(q) ||
      (o.user?.email || '').toLowerCase().includes(q),
  });

  const handleExportCsv = () => {
    const source = orders.filter((o) => {
      const q = search.trim().toLowerCase();
      if (!q) return !status || o.status === status;
      const matchSearch =
        (o.orderCode || '').toLowerCase().includes(q) ||
        (o.user?.fullName || '').toLowerCase().includes(q) ||
        (o.user?.email || '').toLowerCase().includes(q);
      const matchStatus = !status || o.status === status;
      return matchSearch && matchStatus;
    });
    if (!source.length) return toast.error('Không có dữ liệu để xuất');
    const rows = [
      ['Mã đơn', 'Học viên', 'Email', 'Tổng tiền', 'Trạng thái', 'Ngày tạo'],
      ...source.map((o) => [
        o.orderCode,
        o.user?.fullName || '',
        o.user?.email || '',
        o.totalAmount,
        o.status,
        new Date(o.createdAt).toLocaleString('vi-VN'),
      ]),
    ];
    downloadCsv(`don-hang-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Đã xuất ${source.length} đơn`);
  };

  const getStatusBadge = (s) => {
    const map = {
      paid:      { cls: 'pill-success', text: 'Đã thanh toán' },
      pending:   { cls: 'pill-warning', text: 'Chờ thanh toán' },
      cancelled: { cls: 'pill-danger',  text: 'Đã hủy' },
    };
    const m = map[s] || { cls: '', text: s };
    return <span className={`status-pill ${m.cls}`}>{m.text}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Quản lý đơn hàng</h1>
          <p>Lịch sử giao dịch và đăng ký khóa học</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo mã đơn, học viên..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="form-control" style={{ width: '200px' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
            <Download size={16} /> Xuất CSV
          </button>
        </div>

        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Học Viên</th>
                <th>Khóa Học</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><Loading /></td></tr>
              ) : pagedOrders.length === 0 ? (
                <tr><td colSpan="6"><EmptyState title="Không có đơn hàng" message="Thử đổi bộ lọc hoặc từ khóa." /></td></tr>
              ) : pagedOrders.map(order => (
                <tr key={order.id}>
                  <td data-label="Mã đơn">
                    <code style={{
                      color: 'var(--primary)', fontWeight: 700,
                      background: 'var(--primary-50)', padding: '2px 8px',
                      borderRadius: '4px', fontSize: '0.8rem',
                    }}>#{order.orderCode}</code>
                  </td>
                  <td data-label="Học viên">
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.user?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                  </td>
                  <td data-label="Khóa học">
                    {(order.orderItems || []).map(item => (
                      <div key={item.id} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>•</span> {item.course?.title}
                      </div>
                    ))}
                  </td>
                  <td data-label="Tổng tiền" style={{ fontWeight: 700 }}>{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</td>
                  <td data-label="Trạng thái">{getStatusBadge(order.status)}</td>
                  <td data-label="Thao tác" className="actions-cell">
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Xác nhận thanh toán */}
                      {order.status === 'pending' && (
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          style={{ color: 'var(--success)' }}
                          onClick={() => handleUpdateStatus(order.id, 'paid')}
                          title="Xác nhận thanh toán"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {/* Hủy đơn */}
                      {order.status === 'pending' && (
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          style={{ color: 'var(--warning)' }}
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          title="Hủy đơn"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {/* Cấp quyền mua thủ công */}
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ color: '#7c3aed' }}
                        onClick={() => handleGrantAccess(order.id)}
                        title="Cấp quyền truy cập khóa học"
                      >
                        <ShieldCheck size={14} />
                      </button>
                      {/* Chi tiết */}
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => setSelectedOrder(order)}
                        title="Chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      {/* Xóa */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(order.id)}
                        title="Xóa đơn hàng"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem' }}>
                Chi Tiết Đơn{' '}
                <code style={{ background: 'var(--primary-50)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
                  #{selectedOrder.orderCode}
                </code>
              </h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Khách Hàng</h4>
                  <p style={{ fontWeight: 600 }}>{selectedOrder.user?.fullName}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedOrder.user?.email}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedOrder.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Giao Dịch</h4>
                  <p style={{ fontSize: '0.85rem' }}>Ngày: <strong>{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</strong></p>
                  <p style={{ fontSize: '0.85rem' }}>Số tiền: <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount)}đ</strong></p>
                  <p style={{ fontSize: '0.85rem' }}>Trạng thái: {getStatusBadge(selectedOrder.status)}</p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>Khóa Học Trong Đơn</h4>
                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  {(selectedOrder.orderItems || []).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ fontWeight: 500 }}>{item.course?.title}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{new Intl.NumberFormat('vi-VN').format(item.price)}đ</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ color: '#7c3aed', borderColor: '#7c3aed' }}
                    onClick={() => handleGrantAccess(selectedOrder.id)}
                  >
                    <ShieldCheck size={16} /> Cấp quyền mua
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(selectedOrder.id)}
                  >
                    <Trash2 size={16} /> Xóa đơn
                  </button>
                </div>
                <button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
