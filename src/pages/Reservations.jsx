  import React, {useEffect, useState} from 'react'
  import { getTables, getReservations, createReservation, updateReservation, deleteReservation, getOrders, getInvoiceByOrderId, createInvoice } from '../api'
  import Pagination from '../components/Pagination'
  import html2pdf from 'html2pdf.js'

  export default function Reservations(){
    const [tables, setTables] = useState([])
    const [reservations, setReservations] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [form, setForm] = useState({customerName:'',customerPhone:'',partySize:2,reservationTime:'',table:{id:null}, status:'CONFIRMED'})
    const [editId, setEditId] = useState(null)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(()=>{ load() }, [])

    async function load(){
      try {
        const [t, r] = await Promise.all([getTables(), getReservations()]);
        setReservations(r);
        setTables(refreshTablesStatus(t, r));
      } catch(err) { console.error('Error:', err) }
    }

// Hàm helper để cập nhật trạng thái bàn
function refreshTablesStatus(tablesList, reservationsList) {
  return tablesList.map(table => {
    const isReserved = reservationsList.some(r => r.table?.id === table.id && r.status !== 'CANCELLED');
    return { ...table, status: isReserved ? 'RESERVED' : 'AVAILABLE'};
  });
}

async function save(){
  if (loading) return
  setError(null)
  setSuccess(null)
  setLoading(true)

  // basic validation
  if (!form.customerName || form.customerName.trim() === '') { 
    setError('Tên khách là bắt buộc')
    setLoading(false)
    return 
  }
  if (!form.customerPhone || !/^[0-9]{9,11}$/.test(form.customerPhone)) {
    setError('Số điện thoại không hợp lệ (chỉ gồm 9–11 số)');
    setLoading(false);
    return;
  }
  if (!form.partySize || isNaN(form.partySize) || form.partySize < 1) { 
    setError('Số người không hợp lệ')
    setLoading(false)
    return 
  }
  if (!form.table || !form.table.id) { 
    setError('Vui lòng chọn bàn')
    setLoading(false)
    return 
  }

  const selected = tables.find(t => t.id === form.table.id)
  if (!selected) { 
    setError('Bàn đã chọn không tồn tại')
    setLoading(false)
    return 
  }
  if (selected.capacity != null && form.partySize > selected.capacity){ 
    setError('Số người lớn hơn sức chứa của bàn đã chọn')
    setLoading(false)
    return 
  }

  try {
    let saved = null
    if (editId) {
      saved = await updateReservation(editId, form)
      setSuccess('Cập nhật đặt bàn thành công')
      setEditId(null)
    } else {
      saved = await createReservation(form)
      setSuccess('Tạo đặt bàn thành công')
    }

    // reset form
    setForm({customerName:'',customerPhone:'',partySize:2,reservationTime:'',table:{id:null}, status:'CONFIRMED'})

    // load lại dữ liệu từ server và cập nhật trạng thái bàn
    const [t, r] = await Promise.all([getTables(), getReservations()])
    setReservations(r)
    setTables(refreshTablesStatus(t, r))
  } catch(err) {
    console.error('Error saving reservation:', err)
    const status = err?.response?.status
    if (status === 401) {
      setError('Chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.');
      localStorage.removeItem('token')
      setTimeout(()=> window.location.href = '/login', 800)
    } else {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || 'Lỗi khi gọi API'
      setError(msg)
    }
  } finally {
    setLoading(false)
  }
}


    function edit(r){
      setForm({
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        partySize: r.partySize,
        reservationTime: r.reservationTime,
        table: r.table ? { id: r.table.id } : { id: null },
        status: r.status
      })
      setEditId(r.id)
    }

    function cancel(){ 
      setForm({customerName:'',customerPhone:'',partySize:2,reservationTime:'',table:{id:null}, status:'CONFIRMED'})
      setEditId(null) 
    }

    async function remove(id){
      if (window.confirm('Hủy đặt bàn này?')) {
        try { await deleteReservation(id); load() } catch(err) { console.error('Error:', err) }
      }
    }

    async function generateInvoice(reservation) {
      if (!reservation.id) {
        setError('Không tìm thấy ID đặt bàn');
        return;
      }

      try {
        setError(null);
        setSuccess(null);
        
        // Lấy danh sách orders liên quan đến reservation này
        const allOrders = await getOrders();
        const orders = allOrders.filter(o => o.reservation?.id === reservation.id);
        
        if (!orders || orders.length === 0) {
          setError('Không tìm thấy đơn hàng nào cho đặt bàn này');
          return;
        }

        // Lọc orders có items (không yêu cầu total > 0 nữa)
        const validOrders = orders.filter(o => o.items && o.items.length > 0);
        
        if (validOrders.length === 0) {
          setError('Không có đơn hàng hợp lệ (không có items)');
          return;
        }

        // Tạo hóa đơn cho từng order hợp lệ
        const invoices = [];
        const errors = [];
        
        for (const order of validOrders) {
          try {
            console.log('Creating invoice for order:', order.id);
            const inv = await createInvoice(order.id);
            invoices.push(inv);
          } catch(err) {
            console.error('Error creating invoice for order ' + order.id, err);
            const errMsg = err?.response?.data?.error || err?.message || 'Lỗi không xác định';
            errors.push(`Order ${order.id}: ${errMsg}`);
          }
        }

        if (invoices.length === 0) {
          setError('Không thể tạo hóa đơn. ' + (errors.length > 0 ? errors.join('; ') : ''));
          return;
        }

        // Hiển thị chi tiết hóa đơn
        let invoiceHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="text-align: center; margin-bottom: 20px;">HÓA ĐƠN</h2>
            <div style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
              <p><strong>Khách hàng:</strong> ${reservation.customerName}</p>
              <p><strong>Số điện thoại:</strong> ${reservation.customerPhone}</p>
              <p><strong>Số người:</strong> ${reservation.partySize}</p>
              <p><strong>Bàn:</strong> ${reservation.table?.name}</p>
              <p><strong>Thời gian đặt:</strong> ${new Date(reservation.reservationTime).toLocaleString('vi-VN')}</p>
            </div>
            <div style="margin-bottom: 15px;">
              <h3>Chi tiết đơn hàng:</h3>
        `;

        for (let i = 0; i < validOrders.length; i++) {
          const order = validOrders[i];
          invoiceHTML += `<div style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">`;
          invoiceHTML += `<p><strong>Đơn #${order.id}</strong></p>`;
          
          if (order.items && order.items.length > 0) {
            invoiceHTML += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">`;
            invoiceHTML += `<thead style="background-color: #ddd;"><tr><th style="text-align: left; padding: 5px;">Tên món</th><th style="text-align: center; padding: 5px;">SL</th><th style="text-align: right; padding: 5px;">Giá</th><th style="text-align: right; padding: 5px;">Thành tiền</th></tr></thead>`;
            invoiceHTML += `<tbody>`;
            
            order.items.forEach(item => {
              const itemTotal = (item.price || 0) * (item.quantity || 1);
              invoiceHTML += `<tr><td style="padding: 5px;">${item.menuItem?.name || 'N/A'}</td>`;
              invoiceHTML += `<td style="text-align: center; padding: 5px;">${item.quantity || 1}</td>`;
              invoiceHTML += `<td style="text-align: right; padding: 5px;">${(item.price || 0).toLocaleString('vi-VN')} đ</td>`;
              invoiceHTML += `<td style="text-align: right; padding: 5px;"><strong>${itemTotal.toLocaleString('vi-VN')} đ</strong></td></tr>`;
            });
            
            invoiceHTML += `</tbody></table>`;
          }
          
          invoiceHTML += `<p style="text-align: right; font-size: 16px;"><strong>Tổng cộng: ${(order.total || 0).toLocaleString('vi-VN')} đ</strong></p>`;
          invoiceHTML += `</div>`;
        }

        const grandTotal = validOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        invoiceHTML += `<div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #000;">`;
        invoiceHTML += `<p style="font-size: 18px; text-align: right;"><strong>TỔNG CỘNG: ${grandTotal.toLocaleString('vi-VN')} đ</strong></p>`;
        invoiceHTML += `</div>`;
        invoiceHTML += `<div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">`;
        invoiceHTML += `<p>Cảm ơn quý khách đã sử dụng dịch vụ</p>`;
        invoiceHTML += `<p>Ngày in: ${new Date().toLocaleString('vi-VN')}</p>`;
        invoiceHTML += `</div></div>`;

        // Tạo PDF từ HTML
        const element = document.createElement('div');
        element.innerHTML = invoiceHTML;
        element.style.position = 'absolute';
        element.style.left = '-9999px'; // Ẩn element
        document.body.appendChild(element);

        const options = {
          margin: 0.5,
          filename: `HoaDon_${reservation.id}_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save().then(() => {
          document.body.removeChild(element);
          setSuccess('Hóa đơn PDF được xuất thành công');
          setTimeout(() => setSuccess(null), 3000);
        }).catch(err => {
          document.body.removeChild(element);
          console.error('Error generating PDF:', err);
          setError('Lỗi khi xuất PDF');
        });
      } catch(err) {
        console.error('Error generating invoice:', err);
        const msg = err?.response?.data?.message || err?.message || 'Lỗi khi xuất hóa đơn';
        setError(msg);
      }
    }

    const getStatusBadge = (status) => {
      let badgeClass = 'badge-pending'
      if (status === 'CONFIRMED') badgeClass = 'badge-done'
      else if (status === 'CANCELLED') badgeClass = 'badge-occupied'
      else if (status === 'COMPLETED') badgeClass = 'badge-info'
      return <span className={`badge ${badgeClass}`}>{status}</span>
    }

    return (
      <div>
        <div className="page-header">
          <h2>📅 Quản lý Đặt bàn</h2>
        </div>
        <div className="card">
          <div className="form-group">
            <input 
              placeholder="Tên khách" 
              value={form.customerName} 
              onChange={e=>setForm({...form,customerName:e.target.value})}
              autoFocus
            />
            <input 
    placeholder="Điện thoại" 
    value={form.customerPhone} 
    onChange={e=>{
      const v = e.target.value;
      if (/^\d*$/.test(v)) {  // chỉ cho nhập số
        setForm({...form, customerPhone: v})
      }
    }}
  />

            <input 
              type="number" 
              placeholder="Số người" 
              min="1"
              value={form.partySize} 
              onChange={e=>setForm({...form,partySize:parseInt(e.target.value)})}
            />
            <select 
  value={form.table.id || ''} 
  onChange={e => setForm({...form, table: {id: parseInt(e.target.value)||null}})}
>
  <option value="">-- Chọn bàn --</option>
  {tables.map(t => {
    const tooSmall = t.capacity != null && form.partySize > t.capacity
    const isCurrent = form.table && t.id === form.table.id
    const label = `${t.name} (sức chứa ${t.capacity || '—'})${tooSmall ? ' — không đủ chỗ' : ''}`
    return (
      <option 
        key={t.id} 
        value={t.id} 
        disabled={tooSmall || (!isCurrent && t.status !== 'AVAILABLE')}
      >
        {label}
      </option>
    )
  })}
</select>

            <input 
              type="datetime-local" 
              value={form.reservationTime} 
              onChange={e=>setForm({...form,reservationTime:e.target.value})}
            />
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="CONFIRMED">Xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Hủy</option>
              <option value="PENDING">Chờ xác nhận</option>
            </select>
            <button onClick={save} disabled={loading}>
              {loading ? 'Đang xử lý...' : (editId ? 'Cập nhật' : 'Tạo')}
            </button>
            {editId && <button className="btn-secondary" onClick={cancel}>Hủy</button>}
          </div>
        </div>
        <div className="card">
          {error && <div className="card" style={{borderLeft:'4px solid #e74c3c'}}><div style={{color:'#c0392b'}} className="p-2">{error}</div></div>}
          {success && <div className="card" style={{borderLeft:'4px solid #27ae60'}}><div style={{color:'#166534'}} className="p-2">{success}</div></div>}
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Tên khách</th><th>Điện thoại</th><th>Số người</th><th>Bàn</th><th>Thời gian</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
              <tbody>
                {reservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r=> (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.customerName}</td>
                    <td>{r.customerPhone}</td>
                    <td>{r.partySize}</td>
                    <td>{r.table?.name}</td>
                    <td>{new Date(r.reservationTime).toLocaleString('vi-VN')}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{display:'flex', gap:'6px'}}>
                      <button className="btn-sm" onClick={()=>edit(r)}>Sửa</button>
                      <button className="btn-sm btn-danger" onClick={()=>remove(r.id)}>Xóa</button>
                      {r.status === 'COMPLETED' && <button className="btn-sm" style={{backgroundColor:'#27ae60', color:'white'}} onClick={()=>generateInvoice(r)}>📄 Xuất hóa đơn</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(reservations.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    )
  }
