export function parseJwt(token){
  if (!token) return {}
  try{
    const parts = token.split('.')
    if (parts.length < 2) return {}
    const payload = parts[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  }catch(e){
    try{ return JSON.parse(atob(token.split('.')[1])) }catch(err){ return {} }
  }
}

export function getRolesFromToken(token){
  const p = parseJwt(token)
  if (!p) return []
  // roles may be in claim 'roles' or 'authorities'
  if (Array.isArray(p.roles)) return p.roles
  if (Array.isArray(p.authorities)) return p.authorities
  if (p.role) return [p.role]
  return []
}

export function hasAnyRole(token, allowed){
  const roles = getRolesFromToken(token)
  return allowed.some(r => roles.includes(r))
}
