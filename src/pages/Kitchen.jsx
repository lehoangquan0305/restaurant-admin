import React, { useEffect, useState } from 'react'
import { getPendingKitchenItems, updateItemStatus } from '../api'

export default function Kitchen() {
  const [items, setItems] = useState([])

  useEffect(() => { load() }, [])

  function load() {
    getPendingKitchenItems()
      .then(setItems)
      .catch(() => {})
  }

  async function markCooking(orderId, itemId) {
    if (!orderId || !itemId) return
    await updateItemStatus(orderId, itemId, 'COOKING')
    load()
  }

  async function markDone(orderId, itemId) {
    if (!orderId || !itemId) return
    await updateItemStatus(orderId, itemId, 'DONE')
    load()
  }

  const getStatusBadge = (status) => {
    const map = {
      PENDING: 'badge-pending',
      COOKING: 'badge-occupied',
      DONE: 'badge-done'
    }
    return <span className={`badge ${map[status]}`}>{status}</span>
  }

  return (
    <div>
      <div className="page-header">
        <h2>👨‍🍳 Bếp — Công việc Đang chờ</h2>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Món ăn</th>
                <th>SL</th>
                <th>Đơn hàng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {items.map(i => {
                const disabledCooking = i.status !== 'PENDING'
                const disabledDone = i.status !== 'COOKING'
                const isDone = i.status === 'DONE'

                return (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{i.menuItemName || '—'}</td>
                    <td>{i.quantity}</td>
                    <td>{i.orderId}</td>
                    <td>{getStatusBadge(i.status)}</td>

                    <td style={{ display: 'flex', gap: '6px' }}>
                      {isDone ? (
                        <span style={{ color: '#27ae60', fontWeight: '600' }}>✓ Sẵn sàng phục vụ</span>
                      ) : (
                        <>
                          <button
                            className="btn-sm"
                            disabled={disabledCooking}
                            style={{
                              opacity: disabledCooking ? 0.4 : 1,
                              cursor: disabledCooking ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => markCooking(i.orderId, i.id)}
                          >
                            Đang nấu
                          </button>

                          <button
                            className="btn-sm btn-success"
                            disabled={disabledDone}
                            style={{
                              opacity: disabledDone ? 0.4 : 1,
                              cursor: disabledDone ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => markDone(i.orderId, i.id)}
                          >
                            Xong
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  )
}
