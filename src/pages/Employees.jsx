import React, {useEffect, useState} from 'react'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getRoles } from '../api'
import Pagination from '../components/Pagination'

export default function Employees(){
  const [list, setList] = useState([])
  const [roles, setRoles] = useState([])
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [fullName,setFullName] = useState('')
  const [email,setEmail] = useState('')
  const [phone,setPhone] = useState('')
  const [selectedRoleId,setSelectedRoleId] = useState('')
  const [editId, setEditId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(()=>{ load() }, [])
  
  function load(){ 
    setCurrentPage(1)
    getEmployees().then(setList).catch(()=>{})
    getRoles().then(setRoles).catch(()=>{})
  }

  async function save(){
    try {
      const payload = { username, password, fullName, email, phone, roles: selectedRoleId ? [{ id: selectedRoleId }] : [] }
      if (editId) {
        await updateEmployee(editId, payload)
        setEditId(null)
      } else {
        await createEmployee(payload)
      }
      reset()
      load()
    } catch(err) { console.error('Error:', err) }
  }

  function edit(u){
    setUsername(u.username)
    setPassword('')
    setFullName(u.fullName || '')
    setEmail(u.email || '')
    setPhone(u.phone || '')
    setSelectedRoleId(u.roles?.length > 0 ? u.roles[0].id : '')
    setEditId(u.id)
  }

  function reset(){
    setUsername('')
    setPassword('')
    setFullName('')
    setEmail('')
    setPhone('')
    setSelectedRoleId('')
    setEditId(null)
  }

  async function remove(id){
    if (window.confirm('Xóa nhân viên này?')) {
      try { 
        await deleteEmployee(id)
        load()
      } catch(err) { console.error('Error:', err) }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>👥 Quản lý Nhân viên</h2>
      </div>
      <div className="card">
        <div className="form-group">
          <input 
            placeholder="Tên đăng nhập" 
            value={username} 
            onChange={e=>setUsername(e.target.value)}
            autoFocus
            disabled={editId ? true : false}
          />
          <input 
            placeholder="Mật khẩu {editId ? '(để trống nếu không đổi)' : ''}" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            type="password"
          />
          <input 
            placeholder="Họ tên" 
            value={fullName} 
            onChange={e=>setFullName(e.target.value)}
          />
          <input 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)}
          />
          <input 
            placeholder="Điện thoại" 
            value={phone} 
            onChange={e=>setPhone(e.target.value)}
          />
          <select value={selectedRoleId} onChange={e=>setSelectedRoleId(e.target.value)}>
            <option value="">-- Chọn chức vụ --</option>
            {roles.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button onClick={save}>{editId ? 'Cập nhật' : 'Tạo'}</button>
          {editId && <button className="btn-secondary" onClick={reset}>Hủy</button>}
        </div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Chức vụ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(u=> (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span style={{fontSize:'12px', fontWeight:'600', color:'#667eea'}}>
                      {(u.roles||[]).map(r=>r.name).join(', ')}
                    </span>
                  </td>
                  <td style={{display:'flex', gap:'6px'}}>
                    <button className="btn-sm" onClick={()=>edit(u)}>Sửa</button>
                    <button className="btn-sm btn-danger" onClick={()=>remove(u.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(list.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
