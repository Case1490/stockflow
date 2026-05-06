import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const instalar = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setPrompt(null)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, width: 'calc(100% - 32px)', maxWidth: '380px'
    }}>
      <div style={{
        background: 'rgba(15,12,41,0.97)', border: '1px solid rgba(45,212,191,0.3)',
        borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #0d9488, #2dd4bf)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
        }}>📦</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
            Instalar StockFlow
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Accede rápido desde tu pantalla de inicio
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setVisible(false)} style={{
            padding: '6px 10px', borderRadius: '10px', fontSize: '11px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
          }}>
            No
          </button>
          <button onClick={instalar} style={{
            padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
            background: 'linear-gradient(135deg, #0d9488, #2dd4bf)',
            border: 'none', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Download size={12} /> Instalar
          </button>
        </div>
      </div>
    </div>
  )
}