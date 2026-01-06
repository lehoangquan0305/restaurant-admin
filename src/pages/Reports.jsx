import React, {useEffect, useState} from 'react'
import axios from 'axios'

export default function Reports(){
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  
  useEffect(()=>{
    axios.get((import.meta.env.VITE_API_BASE||'https://restaurant-backend-production-4830.up.railway.app') + '/api/reports/summary/today', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }})
      .then(r=>{
        console.log('Reports data:', r.data)
        setData(r.data)
      })
      .catch(err=>{
        console.error('Reports error:', err)
        setError('Lỗi tải dữ liệu: ' + (err.response?.data?.message || err.message))
      })
  }, [])

  if (error) return <div style={{padding:20, color:'red'}}>⚠️ {error}</div>
  if (!data) return <div style={{padding:20}}>Đang tải...</div>
  
  return (
    <div>
      <div className="page-header">
        <h2>📈 Báo cáo — Hôm nay</h2>
      </div>
      {data.totalOrders === 0 ? (
        <div style={{padding: 20, textAlign: 'center', color: '#999'}}>
          Chưa có đơn hàng hôm nay
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16}}>
          <div className="card" style={{textAlign:'center', minHeight:120, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
            <div style={{fontSize:28, fontWeight:700, color:'#667eea'}}>📊 {data.totalOrders}</div>
            <div style={{fontSize:13, color:'#666', marginTop:8, textTransform:'uppercase'}}>Tổng đơn hàng</div>
          </div>
          <div className="card" style={{textAlign:'center', minHeight:120, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
            <div style={{fontSize:28, fontWeight:700, color:'#27ae60'}}>💰 {data.revenue?.toLocaleString?.() || data.revenue}</div>
            <div style={{fontSize:13, color:'#666', marginTop:8, textTransform:'uppercase'}}>Doanh thu</div>
          </div>
          <div className="card" style={{textAlign:'center', minHeight:120, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
            <div style={{fontSize:28, fontWeight:700, color:'#f39c12'}}>⏳ {data.inProgress}</div>
            <div style={{fontSize:13, color:'#666', marginTop:8, textTransform:'uppercase'}}>Đang xử lý</div>
          </div>
          <div className="card" style={{textAlign:'center', minHeight:120, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
            <div style={{fontSize:28, fontWeight:700, color:'#3498db'}}>✓ {data.completed}</div>
            <div style={{fontSize:13, color:'#666', marginTop:8, textTransform:'uppercase'}}>Hoàn thành</div>
          </div>
        </div>
      )}
    </div>
  )
}
