'use client'

import { useEffect, useRef } from 'react'

export default function TradingViewWidget({ src, config, height = 500, className = '' }) {
  const containerRef = useRef(null)
  const configStr = JSON.stringify(config)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = src
    script.async = true
    script.text = configStr
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [src, configStr])

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container w-full overflow-hidden ${className}`}
      style={{ height }}
    />
  )
}
