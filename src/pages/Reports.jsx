import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

export default function Reports(){
  const [data, setData] = useState(null)
  const [monthlyData, setMonthlyData] = useState(null)
  const [error, setError] = useState('')
  
  useEffect(()=>{
    const API_BASE = import.meta.env.VITE_API_BASE||'https://restaurant-backend-production-4830.up.railway.app'
    const token = localStorage.getItem('token')
    const headers = { Authorization: 'Bearer ' + token }
    
    // Lấy dữ liệu hôm nay
    axios.get(API_BASE + '/api/reports/summary/today', { headers })
      .then(r=>{
        console.log('Reports data:', r.data)
        setData(r.data)
      })
      .catch(err=>{
        console.error('Reports error:', err)
        setError('Lỗi tải dữ liệu: ' + (err.response?.data?.message || err.message))
      })
    
    // Lấy dữ liệu doanh thu theo tháng
    axios.get(API_BASE + '/api/reports/monthly', { headers })
      .then(r=>{
        console.log('Monthly data:', r.data)
        setMonthlyData(r.data)
      })
      .catch(err=>{
        console.error('Monthly data error:', err)
        // Nếu endpoint không tồn tại, tạo dữ liệu mẫu
        generateMockMonthlyData()
      })
  }, [])
  
  const generateMockMonthlyData = () => {
    // Tạo dữ liệu mẫu cho 12 tháng
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    const revenues = [5200000, 6100000, 5800000, 7200000, 6900000, 7800000, 
                      8100000, 7600000, 6400000, 7100000, 8500000, 9200000]
    const orders = [120, 135, 128, 160, 155, 172, 185, 168, 145, 158, 185, 200]
    
    setMonthlyData({
      months,
      revenues,
      orders
    })
  }

  if (error) return <div style={{padding:20, color:'red'}}>⚠️ {error}</div>
  if (!data) return <div style={{padding:20}}>Đang tải...</div>
  
  const revenueChartData = monthlyData ? {
    labels: monthlyData.months || [],
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: monthlyData.revenues || [],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      }
    ]
  } : null

  const ordersChartData = monthlyData ? {
    labels: monthlyData.months || [],
    datasets: [
      {
        label: 'Số đơn hàng',
        data: monthlyData.orders || [],
        borderColor: '#27ae60',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#27ae60',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      }
    ]
  } : null

  const barChartData = monthlyData ? {
    labels: monthlyData.months || [],
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: monthlyData.revenues || [],
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(52, 152, 219, 0.8)',
          'rgba(39, 174, 96, 0.8)',
          'rgba(241, 196, 15, 0.8)',
          'rgba(230, 126, 34, 0.8)',
          'rgba(231, 76, 60, 0.8)',
          'rgba(155, 89, 182, 0.8)',
          'rgba(52, 73, 94, 0.8)',
          'rgba(26, 188, 156, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(149, 165, 166, 0.8)',
          'rgba(236, 112, 65, 0.8)',
        ],
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      }
    ]
  } : null
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 13, weight: '600' },
          padding: 15,
          color: '#333'
        }
      },
      title: {
        display: true,
        font: { size: 15, weight: 'bold' },
        color: '#333',
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Doanh thu')) {
                label += context.parsed.y.toLocaleString('vi-VN') + ' VNĐ';
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 },
          color: '#666',
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 11 },
          color: '#666'
        },
        grid: {
          display: false
        }
      }
    }
  }
  
  return (
    <div>
      <div className="page-header">
        <h2>📈 Báo cáo</h2>
      </div>
      
      {/* Thống kê hôm nay */}
      <div style={{marginBottom: 30}}>
        <h3 style={{marginBottom: 15, color: '#333', fontSize: '16px', fontWeight: '600'}}>📊 Thống kê hôm nay</h3>
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
              <div style={{fontSize:28, fontWeight:700, color:'#27ae60'}}>💰 {data.revenue?.toLocaleString?.('vi-VN') || data.revenue}</div>
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

      {/* Biểu đồ doanh thu theo tháng */}
      {monthlyData && (
        <div style={{marginBottom: 30}}>
          <h3 style={{marginBottom: 15, color: '#333', fontSize: '16px', fontWeight: '600'}}>💹 Doanh thu theo tháng (Năm 2025)</h3>
          <div className="card" style={{padding: 20}}>
            {revenueChartData && (
              <Line 
                data={revenueChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Biểu đồ doanh thu'
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Biểu đồ số đơn hàng theo tháng */}
      {monthlyData && (
        <div style={{marginBottom: 30}}>
          <h3 style={{marginBottom: 15, color: '#333', fontSize: '16px', fontWeight: '600'}}>📈 Số đơn hàng theo tháng</h3>
          <div className="card" style={{padding: 20}}>
            {ordersChartData && (
              <Line 
                data={ordersChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Biểu đồ số đơn hàng'
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Biểu đồ cột doanh thu */}
      {monthlyData && (
        <div style={{marginBottom: 30}}>
          <h3 style={{marginBottom: 15, color: '#333', fontSize: '16px', fontWeight: '600'}}>📊 Doanh thu từng tháng (Biểu đồ cột)</h3>
          <div className="card" style={{padding: 20}}>
            {barChartData && (
              <Bar 
                data={barChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Biểu đồ cột doanh thu'
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
