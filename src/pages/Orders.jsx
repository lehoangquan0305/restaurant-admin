import React, {useEffect, useMemo, useState} from 'react'
import { getOrders } from '../api'
import Pagination from '../components/Pagination'

export default function Orders(){
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
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
              <button className="btn-secondary btn-sm" onClick={()=>setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
