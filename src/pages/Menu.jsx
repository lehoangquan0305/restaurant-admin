import React, {useEffect, useState} from 'react'
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../api'
import Pagination from '../components/Pagination'

export default function Menu(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({name:'',description:'',price:0,category:'',available:true,imageFile:null})
  const [editId, setEditId] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  useEffect(()=>load(), [])
  
  function load(){ getMenu().then(setItems).catch(()=>{}) }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setForm({...form, imageFile: file})
      // Hiển thị preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function save(){
    try {
      if (editId) {
        await updateMenuItem(editId, form)
        setEditId(null)
      } else {
        await createMenuItem(form)
      }
      setForm({name:'',description:'',price:0,category:'',available:true,imageFile:null})
      setImagePreview(null)
      load()
    } catch(err) { console.error('Error:', err) }
  }

  function edit(i){ 
    setForm({...i, imageFile: null})
    setEditId(i.id)
    // Nếu có ảnh cũ, hiển thị preview
    if (i.image) {
      setImagePreview(i.image)
    } else {
      setImagePreview(null)
    }
  }
  
  function cancel(){
    setForm({name:'',description:'',price:0,category:'',available:true,imageFile:null})
    setEditId(null)
    setImagePreview(null)
  }
  
  async function remove(id){ 
    if (window.confirm('Xóa món ăn này?')) {
      try {
        await deleteMenuItem(id)
        load()
      } catch(err) { console.error('Error:', err) }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>📖 Quản lý Menu</h2>
      </div>
      <div className="card">
        <div className="form-group">
          <input 
            placeholder="Tên món ăn" 
            value={form.name} 
            onChange={e=>setForm({...form,name:e.target.value})}
            autoFocus
          />
          <input 
            placeholder="Danh mục (VD: Khai vị, Món chính)" 
            value={form.category} 
            onChange={e=>setForm({...form,category:e.target.value})}
          />
          <input 
            placeholder="Giá" 
            type="number" 
            step="0.01" 
            min="0"
            value={form.price} 
            onChange={e=>setForm({...form,price:parseFloat(e.target.value)||0})}
          />
          <input 
            placeholder="Mô tả" 
            value={form.description} 
            onChange={e=>setForm({...form,description:e.target.value})}
          />
          <label style={{marginTop: '8px', display: 'block', fontWeight: 'bold'}}>
            Hình ảnh {editId && '(để trống để giữ ảnh cũ)'}
          </label>
          <input 
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{marginBottom: '8px'}}
          />
          {imagePreview && (
            <div style={{marginBottom: '8px', textAlign: 'center'}}>
              <img 
                src={imagePreview} 
                alt="preview" 
                style={{maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', border: '1px solid #ddd', padding: '4px'}}
              />
            </div>
          )}
          <select value={form.available ? 'true' : 'false'} onChange={e=>setForm({...form,available:e.target.value==='true'})}>
            <option value="true">Có sẵn</option>
            <option value="false">Hết hàng</option>
          </select>
          <button onClick={save}>{editId ? 'Cập nhật' : 'Thêm'}</button>
          {editId && <button className="btn-secondary" onClick={cancel}>Hủy</button>}
        </div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Hình</th><th>Tên</th><th>Danh mục</th><th>Giá (VND)</th><th>Mô tả</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(i=> (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td style={{textAlign: 'center'}}>
                    {i.image ? (
                      <img 
                        src={i.image} 
                        alt={i.name}
                        style={{width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover'}}
                      />
                    ) : (
                      <span style={{color: '#999'}}>Không</span>
                    )}
                  </td>
                  <td><strong>{i.name}</strong></td>
                  <td>{i.category}</td>
                  <td>{(i.price || 0).toLocaleString('vi-VN')}</td>
                  <td style={{fontSize:'12px', color:'#666'}}>{i.description}</td>
                  <td><span className={i.available ? 'badge badge-done' : 'badge badge-occupied'}>{i.available ? 'Có' : 'Hết'}</span></td>
                  <td style={{display:'flex', gap:'6px'}}>
                    <button className="btn-sm" onClick={()=>edit(i)}>Sửa</button>
                    <button className="btn-sm btn-danger" onClick={()=>remove(i.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(items.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
