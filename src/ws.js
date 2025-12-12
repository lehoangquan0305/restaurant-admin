import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

let client = null

export function connect(onOrder) {
  if (client) return client
  const socket = new SockJS((import.meta.env.VITE_API_BASE || 'https://restaurant-backend-production-a5f1.up.railway.app') + '/ws')
  client = new Client({
    webSocketFactory: () => socket,
    debug: () => {},
    onConnect: () => {
      client.subscribe('/topic/orders', msg => {
        try { onOrder(JSON.parse(msg.body)) } catch(e){}
      })
    }
  })
  client.activate()
  return client
}

export function disconnect(){ if (client) client.deactivate(); client = null }
