import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export default function Waiter() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [serving, setServing] = useState(false)

  const token = localStorage.getItem('token')

  // Lấy danh sách bàn RESERVED
  const fetchTables = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/waiter/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTables(res.data || [])
    } catch (err) {
      console.error('Error fetching tables:', err)
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
    const interval = setInterval(fetchTables, 5000) // Refresh mỗi 5s
    return () => clearInterval(interval)
  }, [])

  // Phục vụ bàn
  const handleServe = async (tableId) => {
    if (!window.confirm('Xác nhận phục vụ bàn này?')) return
    
    setServing(true)
    try {
      await axios.post(`${API_URL}/api/waiter/tables/${tableId}/serve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedTable(null)
      await fetchTables()
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      alert('❌ ' + msg)
    } finally {
      setServing(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>🍽️ Phục vụ</h2>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>}

      {!loading && tables.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
          Không có bàn nào cần phục vụ
        </div>
      )}

      {!loading && tables.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          padding: '16px'
        }}>
          {tables.map(table => (
            <div
              key={table.tableId}
              onClick={() => setSelectedTable(table)}
              style={{
                padding: '16px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: table.allItemsDone ? '#e8f5e9' : '#fff3e0',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>
                📍 {table.tableName}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                Sức chứa: {table.capacity} người
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                📦 {table.items?.length || 0} món ăn
              </div>
              <div style={{
                fontSize: 13,
                marginTop: 8,
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: table.allItemsDone ? '#4caf50' : '#ff9800',
                color: '#fff',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {table.allItemsDone ? '✓ Sẵn sàng phục vụ' : '⏳ Đang chế biến'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết bàn */}
      {selectedTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>
              📍 {selectedTable.tableName}
            </h3>
            
            <div style={{ marginBottom: 16, fontSize: 13, color: '#666' }}>
              <strong>Sức chứa:</strong> {selectedTable.capacity} người
            </div>

            {selectedTable.notes && (
              <div style={{ marginBottom: 16, padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: 13 }}>
                <strong>📝 Ghi chú:</strong> {selectedTable.notes}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#333' }}>📦 Các món ăn:</strong>
              <div style={{ marginTop: 8 }}>
                {selectedTable.items && selectedTable.items.length > 0 ? (
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0' }}>Tên</th>
                        <th style={{ textAlign: 'center', padding: '8px 0' }}>SL</th>
                        <th style={{ textAlign: 'center', padding: '8px 0' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.items.map(item => (
                        <tr key={item.itemId} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px 0' }}>{item.menuItemName}</td>
                          <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'center', padding: '8px 0' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: item.itemStatus === 'DONE' ? '#4caf50' : '#ff9800',
                              color: '#fff'
                            }}>
                              {item.itemStatus === 'DONE' ? '✓ Xong' : '⏳ ' + item.itemStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#999', fontSize: 13 }}>Không có món ăn</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedTable(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#f5f5f5'
                }}
              >
                Đóng
              </button>
              <button
                onClick={() => handleServe(selectedTable.tableId)}
                disabled={!selectedTable.allItemsDone || serving}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedTable.allItemsDone && !serving ? 'pointer' : 'not-allowed',
                  backgroundColor: selectedTable.allItemsDone && !serving ? '#4caf50' : '#ccc',
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                {serving ? '⏳ Đang xử lý...' : '✓ Phục vụ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
