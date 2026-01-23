import React, {useEffect, useMemo, useState} from 'react'
import { getOrders, createInvoice } from '../api'
import Pagination from '../components/Pagination'
import html2pdf from 'html2pdf.js'

export default function Orders(){
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const itemsPerPage = 10

  useEffect(()=>{
    setLoading(true)
    getOrders().then(list=>{
      setOrders(list || [])
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const statuses = useMemo(()=>['ALL', 'NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], [])

  const getStatusBadge = (status) => {
    const badgeClass = status === 'NEW' ? 'badge-available' : status === 'IN_PROGRESS' ? 'badge-pending' : status === 'COMPLETED' ? 'badge-done' : 'badge-reserved'
    return <span className={`badge ${badgeClass}`}>{status}</span>
  }

  async function generateInvoice(order) {
    try {
      setError(null);
      setSuccess(null);
      
      // Kiểm tra trạng thái
      if (order.status !== 'COMPLETED') {
        setError('Chỉ có thể xuất hóa đơn cho đơn hàng đã hoàn thành');
        return;
      }
      
      // Kiểm tra có items không
      if (!order.items || order.items.length === 0) {
        setError('Đơn hàng không có món ăn để xuất hóa đơn');
        return;
      }
      
      // Tạo invoice nếu cần
      try {
        await createInvoice(order.id);
      } catch(err) {
        console.error('Error creating invoice:', err);
        // Có thể bỏ qua nếu đã có
      }
      
      // Tạo HTML
      let invoiceHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="text-align: center; margin-bottom: 20px;">HÓA ĐƠN</h2>
          <div style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
            <p><strong>Khách hàng:</strong> ${order.customerName || order.createdBy?.fullName || 'N/A'}</p>
            <p><strong>Bàn:</strong> ${order.table?.name || 'N/A'}</p>
            <p><strong>Ghi chú:</strong> ${order.notes || 'N/A'}</p>
            <p><strong>Thời gian:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString('vi-VN')}</p>
          </div>
          <div style="margin-bottom: 15px;">
            <h3>Chi tiết đơn hàng:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <thead style="background-color: #ddd;"><tr><th style="text-align: left; padding: 5px;">Tên món</th><th style="text-align: center; padding: 5px;">SL</th><th style="text-align: right; padding: 5px;">Giá</th><th style="text-align: right; padding: 5px;">Thành tiền</th></tr></thead>
              <tbody>
                ${order.items.map(item => {
                  const itemTotal = (item.price || 0) * (item.quantity || 1);
                  return `<tr><td style="padding: 5px;">${item.menuItem?.name || 'N/A'}</td><td style="text-align: center; padding: 5px;">${item.quantity || 1}</td><td style="text-align: right; padding: 5px;">${(item.price || 0).toLocaleString('vi-VN')} đ</td><td style="text-align: right; padding: 5px;"><strong>${itemTotal.toLocaleString('vi-VN')} đ</strong></td></tr>`;
                }).join('')}
              </tbody>
            </table>
            <p style="text-align: right; font-size: 16px;"><strong>Tổng cộng: ${(order.total || 0).toLocaleString('vi-VN')} đ</strong></p>
          </div>
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>Cảm ơn quý khách đã sử dụng dịch vụ</p>
            <p>Ngày in: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>
      `;
      
      // Debug: log HTML
      console.log('Invoice HTML:', invoiceHTML);
      
      // Tạo PDF trực tiếp từ HTML string
      const options = {
        margin: 0.5,
        filename: `HoaDon_Order_${order.id}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: 'white' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(invoiceHTML).set(options).save().then(() => {
        setSuccess('Hóa đơn PDF được xuất thành công');
        setTimeout(() => setSuccess(null), 3000);
      }).catch(err => {
        console.error('Error generating PDF:', err);
        setError('Lỗi khi xuất PDF: ' + err.message);
      });
    } catch(err) {
      console.error('Error generating invoice:', err);
      setError('Lỗi khi xuất hóa đơn: ' + (err.message || err));
    }
  }

  const filtered = useMemo(()=>{
    return orders.filter(o => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      if (!q) return true
      const s = q.toLowerCase()
      return String(o.id).includes(s) || (o.table?.name || '').toLowerCase().includes(s) || (o.notes || '').toLowerCase().includes(s)
    })
  }, [orders, q, statusFilter])

  const pageData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <div className="page-header">
        <h2>🛒 Đơn Hàng</h2>
        <div className="page-sub">Quản lý và theo dõi tất cả đơn hàng</div>
      </div>

      <div className="card">
        <div className="orders-top">
          <div className="orders-actions">
            <input className="form-input" placeholder="Tìm theo ID, bàn, ghi chú..." value={q} onChange={e=>{setQ(e.target.value); setCurrentPage(1)}} />
            <select className="form-input" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setCurrentPage(1)}}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="orders-stats">
            <div className="stat">Tổng: <strong>{orders.length}</strong></div>
            <div className="stat">Hiện thị: <strong>{filtered.length}</strong></div>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{padding:24, textAlign:'center'}}>Đang tải...</div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bàn</th>
                  <th>Khách</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{width:140}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(o => (
                  <tr key={o.id} className="order-row">
                    <td className="mono">#{o.id}</td>
                    <td>{o.table?.name || '-'}</td>
                    <td>{o.customerName || o.createdBy?.fullName || '-'}</td>
                    <td className="text-right">{o.total?.toLocaleString?.() || o.total} đ</td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td>
                      <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                        <button className="btn-sm btn-secondary" onClick={()=>setSelected(o)}>Chi tiết</button>
                        <button className="btn-sm" onClick={()=>alert('Thao tác tạm thời chưa hỗ trợ')}>Hành động</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr><td colSpan={6} style={{padding:24, textAlign:'center', color:'#777'}}>Không có đơn hàng để hiển thị</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={{marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filtered.length / itemsPerPage))}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3>Đơn #{selected.id}</h3>
              <div>{getStatusBadge(selected.status)}</div>
            </div>
            {error && <div style={{color:'red', marginTop:10}}>{error}</div>}
            {success && <div style={{color:'green', marginTop:10}}>{success}</div>}
            <div style={{marginTop:12}}>
              <div><strong>Bàn:</strong> {selected.table?.name || '-'}</div>
              <div><strong>Khách:</strong> {selected.customerName || selected.createdBy?.fullName || '-'}</div>
              <div><strong>Ghi chú:</strong> {selected.notes || '-'}</div>
            </div>
            <div style={{marginTop:12}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead><tr><th style={{textAlign:'left'}}>Tên</th><th style={{textAlign:'center'}}>SL</th><th style={{textAlign:'right'}}>Giá</th></tr></thead>
                <tbody>
                  {selected.items?.map(it => (
                    <tr key={it.id} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'8px 0'}}>{it.menuItem?.name}</td>
                      <td style={{textAlign:'center'}}>{it.quantity}</td>
                      <td style={{textAlign:'right'}}>{it.price?.toLocaleString?.() || it.price} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:16}}>
              {selected.status === 'COMPLETED' && <button className="btn-sm" style={{backgroundColor:'#27ae60', color:'white'}} onClick={()=>generateInvoice(selected)}>📄 Xuất hóa đơn</button>}
              <button className="btn-secondary btn-sm" onClick={()=>setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
