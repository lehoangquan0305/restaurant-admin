import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login(){
  const [username,setUsername] = useState('admin')
  const [password,setPassword] = useState('123')
  const [error,setError] = useState(null)
  const nav = useNavigate()

  useEffect(()=>{ if (localStorage.getItem('token')) nav('/') }, [])

  async function submit(e){
    e.preventDefault()
    setError(null)
    try{
      console.log('Logging in with username:', username)
      const res = await login(username,password)
      console.log('Login response:', res)
      console.log('Token:', res.token)
      if (res.token) {
        localStorage.setItem('token', res.token)
        console.log('Token saved to localStorage')
        nav('/')
      } else {
        setError('Login failed: no token in response')
      }
    }catch(err){
      console.error('Login error:', err)
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🍽️ Admin Login</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" autoFocus/>
          </div>
          <div className="form-group">
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
          </div>
          <button type="submit">Login</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  )
}
