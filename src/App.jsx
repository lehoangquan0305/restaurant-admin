import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Tables from './pages/Tables'
import Orders from './pages/Orders'
import Kitchen from './pages/Kitchen'
import Employees from './pages/Employees'
import Reports from './pages/Reports'
import Menu from './pages/Menu'
import Reservations from './pages/Reservations'
import Waiter from './pages/Waiter'
import ProtectedRoute from './components/ProtectedRoute'
import { getRolesFromToken } from './utils/auth'
import { useNavigate } from 'react-router-dom'

function LogoutButton(){
  const nav = useNavigate()
  function logout(){ localStorage.removeItem('token'); nav('/login') }
  return <button className="btn-logout" onClick={logout}>Logout</button>
}

export default function App(){
  const loc = useLocation()
  const isLogin = loc.pathname === '/login'
  
  const token = localStorage.getItem('token')
  const roles = token ? getRolesFromToken(token) : []
  const isAdmin = roles.includes('ROLE_ADMIN')
  const isChef = roles.includes('ROLE_CHEF')
  const isWaiter = roles.includes('ROLE_WAITER')

  return (
    <div className="app">
      {!isLogin && (
        <>
          <header className="app-header">
            <div className="header-content">
              <div className="logo">🍽️ Admin</div>
              <LogoutButton/>
            </div>
          </header>
          <div className="layout">
            <aside className="sidebar">
              <nav className="sidenav">
                {isAdmin && <Link to="/" className="nav-item">📊 Trang chủ</Link>}
                {isAdmin && <Link to="/tables" className="nav-item">🪑 Bàn ăn</Link>}
                {(isWaiter || isAdmin) && <Link to="/reservations" className="nav-item">📅 Đặt bàn</Link>}
                {isAdmin && <Link to="/menu" className="nav-item">📖 Menu</Link>}
                {isAdmin && <Link to="/orders" className="nav-item">🛒 Đơn hàng</Link>}
                {(isChef || isAdmin) && <Link to="/kitchen" className="nav-item">👨‍🍳 Bếp</Link>}
                {(isWaiter || isAdmin) && <Link to="/waiter" className="nav-item">🍽️ Phục vụ</Link>}
                {isAdmin && <Link to="/employees" className="nav-item">👥 Nhân viên</Link>}
                {isAdmin && <Link to="/reports" className="nav-item">📈 Báo cáo</Link>}
              </nav>
            </aside>
            <main className="content">
              <Routes>
                <Route path="/" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><Tables/></ProtectedRoute>} />
                <Route path="/tables" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><Tables/></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><Orders/></ProtectedRoute>} />
                <Route path="/kitchen" element={<ProtectedRoute roles={["ROLE_CHEF","ROLE_ADMIN"]}><Kitchen/></ProtectedRoute>} />
                <Route path="/menu" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><Menu/></ProtectedRoute>} />
                <Route path="/reservations" element={<ProtectedRoute roles={["ROLE_WAITER","ROLE_ADMIN"]}><Reservations/></ProtectedRoute>} />
                <Route path="/waiter" element={<ProtectedRoute roles={["ROLE_WAITER","ROLE_ADMIN"]}><Waiter/></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><Employees/></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><Reports/></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </>
      )}
      {isLogin && (
        <Routes>
          <Route path="/login" element={<Login/>} />
        </Routes>
      )}
    </div>
  )
}
