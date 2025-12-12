import React from 'react'
import { Navigate } from 'react-router-dom'
import { getRolesFromToken } from '../utils/auth'

export default function ProtectedRoute({children, roles}){
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />

  if (roles && roles.length > 0) {
    const userRoles = getRolesFromToken(token)
    const ok = roles.some(r => userRoles.includes(r))
    if (!ok) return <Navigate to="/" replace />
  }

  return children
}
