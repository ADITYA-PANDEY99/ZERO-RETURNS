import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import 'driver.js/dist/driver.css'

/**
 * OnboardingTour — Driver.js powered guided tour
 * Triggers automatically on first visit (stored in localStorage)
 * Can also be triggered manually via landing page or settings
 */
export default function OnboardingTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const tourRef = useRef(null)
  const TOUR_KEY = 'zeroreturns-tour-done'

  useEffect(() => {
    // Only run tour on dashboard page
    if (location.pathname !== '/dashboard') return

    // Check if tour already done or forced from landing page
    const forceTour = localStorage.getItem('zeroreturns-start-tour-on-dashboard') === 'true'
    const tourDone = localStorage.getItem(TOUR_KEY)
    
    if (tourDone && !forceTour) return

    // Dynamically import driver.js to keep bundle lean
    import('driver.js').then(({ driver }) => {
      const driverObj = driver({
        animate: true,
        overlayOpacity: 0.6,
        smoothScroll: true,
        allowClose: true,
        overlayColor: '#0a0a14',
        popoverClass: 'zr-driver-popover',
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY, 'true')
          localStorage.removeItem('zeroreturns-start-tour-on-dashboard')
          driverObj.destroy()
        },
        steps: [
          {
            element: '#sidebar-nav',
            popover: {
              title: '🚀 Welcome to ZeroReturn AI!',
              description: 'This is your main navigation. From here, you can access the core dashboards, view analytical logs, upload data, and check candidate capabilities.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#industry-switcher-btn',
            popover: {
              title: '🏢 Multi-Industry Modes',
              description: 'Switch the entire platform layout, KPIs, and ML context instantly between Ecommerce, Food Delivery, Grocery, Banking, and SaaS.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#kpi-cards',
            popover: {
              title: '📊 Live KPI & Scorecards',
              description: 'Real-time indicators tracking total volume, return/risk rates, financial loss at risk, and returns prevented by AI.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#anomaly-banner',
            popover: {
              title: '🚨 Isolation Forest Anomalies',
              description: 'Our backend ML model automatically alerts you to statistical spikes or anomalies in order cancelations or returns.',
              side: 'bottom',
            },
          },
          {
            element: '#trend-chart',
            popover: {
              title: '📈 Return Forecasting Hub',
              description: 'Inspect historical order trends and look ahead with ARIMA-based return predictions and business forecasting metrics.',
              side: 'top',
            },
          },
          {
            element: '#nav-recruiter',
            popover: {
              title: '💼 Recruiter & Capability Matrix',
              description: 'A custom developer portfolio dashboard showcasing architectural diagrams, tech stack details, and candidate skills matrices.',
              side: 'right',
            },
          },
          {
            element: '#chatbot-fab',
            popover: {
              title: '💬 AI Analytics Copilot',
              description: 'Ask questions in plain English or Hindi. Query return trends, trigger voice commands, or get SQL translations instantly.',
              side: 'left',
            },
          },
          {
            popover: {
              title: '🎉 Tour Complete!',
              description: 'You are ready to explore the platform. Switch themes, try recruiter mode, or run predictions now!',
            },
          },
        ],
      })

      tourRef.current = driverObj

      // Small delay so page elements render first
      setTimeout(() => driverObj.drive(), 800)
    }).catch(() => {
      // driver.js failed to load — skip tour silently
    })
  }, [location.pathname])

  // Nothing to render — this is a side-effect-only component
  return null
}

/**
 * Manually re-trigger the tour (e.g. from Settings page "Take Tour" button)
 */
export function useTriggerTour() {
  return () => {
    localStorage.removeItem('zeroreturns-tour-done')
    localStorage.setItem('zeroreturns-start-tour-on-dashboard', 'true')
    window.location.href = '/dashboard'
  }
}
