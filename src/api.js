import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://restaurant-backend-production-a5f1.up.railway.app'

const instance = axios.create({ baseURL: API_BASE })

instance.interceptors.request.use(cfg => {
  const publicAPIs = [
    '/api/auth/login',
    '/api/reservations'
  ];

  // Nếu API thuộc nhóm public → KHÔNG gửi Authorization
  if (publicAPIs.some(api => cfg.url.startsWith(api))) {
    return cfg;
  }

  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    cfg.headers['Authorization'] = 'Bearer ' + token;
  }

  // Không set Content-Type nếu là FormData - để browser tự set
  if (!(cfg.data instanceof FormData)) {
    cfg.headers['Content-Type'] = 'application/json';
  }

  return cfg;
});

export async function login(username, password){
  const r = await instance.post('/api/auth/login', { username, password })
  return r.data
}

// Tables
export async function getTables(){ return (await instance.get('/api/tables')).data }
export async function createTable(t){ return (await instance.post('/api/tables', t)).data }
export async function updateTable(id, t){ return (await instance.put(`/api/tables/${id}`, t)).data }
export async function deleteTable(id){ return (await instance.delete(`/api/tables/${id}`)).data }

// Reservations
export async function getReservations(){ return (await instance.get('/api/reservations')).data }
export async function createReservation(r){
  const payload = {
    customerName: r.customerName || '',
    customerPhone: r.customerPhone || '',
    partySize: typeof r.partySize === 'number' ? r.partySize : parseInt(r.partySize) || 1,
    reservationTime: r.reservationTime 
      ? (typeof r.reservationTime === 'string' ? r.reservationTime : new Date(r.reservationTime).toISOString())
      : new Date().toISOString(),
    tableId: r.table?.id || null,  // đổi từ table object sang tableId
    status: r.status || 'CONFIRMED'
  }

  return (await instance.post('/api/reservations', payload, {
    headers: { 'Content-Type': 'application/json' } // bắt buộc
  })).data
}

export async function updateReservation(id, r){ return (await instance.put(`/api/reservations/${id}`, r)).data }
export async function deleteReservation(id){ return (await instance.delete(`/api/reservations/${id}`)).data }

// Orders
export async function getOrders(){ return (await instance.get('/api/orders')).data }
export async function postOrder(order){ return (await instance.post('/api/orders', order)).data }

// Kitchen
export async function getPendingKitchenItems(){ return (await instance.get('/api/kitchen/items/pending')).data }
export async function updateItemStatus(orderId, itemId, status){ return (await instance.put(`/api/kitchen/items/${orderId}/${itemId}/status?status=${status}`)).data }

// Employees
export async function getEmployees(){ return (await instance.get('/api/employees')).data }
export async function createEmployee(e){ return (await instance.post('/api/employees', e)).data }
export async function updateEmployee(id, e){ return (await instance.put(`/api/employees/${id}`, e)).data }
export async function deleteEmployee(id){ return (await instance.delete(`/api/employees/${id}`)).data }
export async function getRoles(){ return (await instance.get('/api/employees/roles')).data }

// Menu
export async function getMenu(){ return (await instance.get('/api/menu')).data }
export async function createMenuItem(item){ 
  const formData = new FormData()
  
  // Thêm dữ liệu từng field
  formData.append('name', item.name || '')
  formData.append('description', item.description || '')
  formData.append('price', item.price || 0)
  formData.append('available', item.available === true ? 'true' : 'false')
  formData.append('category', item.category || '')
  
  // Thêm file ảnh nếu có
  if (item.imageFile) {
    formData.append('image', item.imageFile)
  }
  
  // Không set Content-Type header - để browser tự set nó với boundary
  return (await instance.post('/api/menu', formData)).data
}

export async function updateMenuItem(id, item){ 
  const formData = new FormData()
  
  // Thêm dữ liệu từng field
  formData.append('name', item.name || '')
  formData.append('description', item.description || '')
  formData.append('price', item.price || 0)
  formData.append('available', item.available === true ? 'true' : 'false')
  formData.append('category', item.category || '')
  
  // Thêm file ảnh nếu có (nếu không có, sẽ giữ ảnh cũ)
  if (item.imageFile) {
    formData.append('image', item.imageFile)
  }
  
  // Không set Content-Type header - để browser tự set nó với boundary
  return (await instance.put(`/api/menu/${id}`, formData)).data
}

export async function deleteMenuItem(id){ return (await instance.delete(`/api/menu/${id}`)).data }

// Billing & Invoices
export async function getInvoiceByOrderId(orderId){ return (await instance.get(`/api/billing/invoice/${orderId}`)).data }
export async function createInvoice(orderId){ return (await instance.post(`/api/billing/invoice/${orderId}`)).data }
export async function payInvoice(invoiceId, amount, method){ return (await instance.post(`/api/billing/pay/${invoiceId}?amount=${amount}&method=${method}`)).data }

export default instance
