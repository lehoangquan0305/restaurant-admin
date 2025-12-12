import React, {useEffect, useState} from 'react'
import { getTables, createTable, updateTable, deleteTable } from '../api'
import Pagination from '../components/Pagination'

export default function Tables(){
  const [tables, setTables] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [form, setForm] = useState({name:'', capacity:2, status:'AVAILABLE'})
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(()=>{ load() }, [])
  
  function load(){ 
    setCurrentPage(1)
    getTables().then(setTables).catch(()=>{}) 
  }
  
  async function save(){
    setError(null)
    setSuccess(null)
    if (!form.name || form.name.trim() === ''){ setError('Tên bàn là bắt buộc'); return }
    if (!form.capacity || isNaN(form.capacity) || form.capacity < 1) { setError('Sức chứa không hợp lệ'); return }
    try {
      if (editId) {
        await updateTable(editId, form)
        setSuccess('Cập nhật bàn thành công')
        setEditId(null)
      } else {
        await createTable(form)
        setSuccess('Thêm bàn thành công')
      }
      setForm({name:'', capacity:2, status:'AVAILABLE'})
      load()
    } catch(err) {
      console.error('Error:', err)
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi gọi API'
      setError(msg)
    }
  }

  function edit(t){ setForm({...t}); setEditId(t.id) }
  function cancel(){ setForm({name:'', capacity:2, status:'AVAILABLE'}); setEditId(null) }
  
  async function remove(id){
    if (window.confirm('Xóa bàn này?')) {
      try { await deleteTable(id); load() } catch(err) { console.error('Error:', err) }
    }
  }

  const getStatusBadge = (status) => {
    const badgeClass = status === 'AVAILABLE' ? 'badge-available' : status === 'OCCUPIED' ? 'badge-occupied' : 'badge-reserved'
    return <span className={`badge ${badgeClass}`}>{status}</span>
  }
  
  return (
    <div>
      <div className="page-header">
        <h2>🪑 Quản lý Bàn Ăn</h2>
      </div>
      {error && <div className="card" style={{borderLeft:'4px solid #e74c3c'}}><div style={{color:'#c0392b'}} className="p-2">{error}</div></div>}
      {success && <div className="card" style={{borderLeft:'4px solid #27ae60'}}><div style={{color:'#166534'}} className="p-2">{success}</div></div>}
      <div className="card">
        <div className="form-group">
          <input 
            placeholder="Tên bàn (VD: Bàn 1, Corner Table)" 
            value={form.name} 
            onChange={e=>setForm({...form,name:e.target.value})}
            autoFocus
          />
          <input 
            placeholder="Sức chứa" 
            type="number" 
            min="1" 
            max="20" 
            value={form.capacity} 
            onChange={e=>setForm({...form,capacity:parseInt(e.target.value)})}
          />
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option value="AVAILABLE">Trống</option>
            <option value="OCCUPIED">Đang dùng</option>
            <option value="RESERVED">Đã đặt</option>
          </select>
          <button onClick={save}>{editId ? 'Cập nhật' : 'Thêm bàn'}</button>
          {editId && <button className="btn-secondary" onClick={cancel}>Hủy</button>}
        </div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Tên</th><th>Sức chứa</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {tables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.capacity}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td style={{display:'flex', gap:'6px'}}>
                    <button className="btn-sm" onClick={()=>edit(t)}>Sửa</button>
                    <button className="btn-sm btn-danger" onClick={()=>remove(t.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(tables.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
