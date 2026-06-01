import { useEffect, useRef, useCallback } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import toast from 'react-hot-toast'

/**
 * useWebSocket — Live update hook
 * Connects to ws://localhost:8000/ws/live-updates
 * Dispatches events to Zustand store and shows toast notifications
 */
export function useWebSocket() {
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const isUnmountedRef = useRef(false)
  const { addLiveOrder } = useDashboardStore()

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return

    try {
      const clientId = `client-${Date.now()}`
      const ws = new WebSocket(`ws://localhost:8000/ws/live-updates?client_id=${clientId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected to ZeroReturn live updates')
        // Send a ping every 20 seconds to keep alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          } else {
            clearInterval(pingInterval)
          }
        }, 20000)
        ws._pingInterval = pingInterval
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          const { event: eventType, data } = payload

          if (eventType === 'new_order' && data) {
            // Add new live order to store
            addLiveOrder({
              ...data,
              risk_level: data.risk_level || 'Medium',
              order_date: new Date().toISOString().split('T')[0],
              image_url: `https://picsum.photos/seed/${data.order_id}/400/400`,
              customer_name: 'Live Customer',
              seller_name: 'ZeroStore Official',
            })

            // Show toast for high risk orders
            if (data.risk_score >= 60) {
              toast.error(
                `⚠️ High Risk Order: ${data.product_name} (Score: ${data.risk_score})`,
                { duration: 5000 }
              )
            } else {
              toast.success(
                `New Order: ${data.product_name}`,
                { duration: 3000 }
              )
            }
          }

          if (eventType === 'anomaly_detected' && data) {
            toast.error(`🚨 Anomaly: ${data.message}`, { duration: 8000 })
          }

          if (eventType === 'return_prevented' && data) {
            toast.success(`✅ Return Prevented! Saved ₹${data.amount?.toLocaleString('en-IN')}`, {
              duration: 5000,
            })
          }
        } catch (e) {
          // ignore parse errors (pong etc)
        }
      }

      ws.onerror = () => {
        // Backend may not be running — fail silently
      }

      ws.onclose = () => {
        if (ws._pingInterval) clearInterval(ws._pingInterval)
        // Auto-reconnect after 5 seconds if not intentionally closed
        if (!isUnmountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 5000)
        }
      }
    } catch (e) {
      // WebSocket not available or backend offline — silent fail
    }
  }, [addLiveOrder])

  useEffect(() => {
    connect()
    return () => {
      isUnmountedRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return wsRef
}
