import { useState } from 'react'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [registrado, setRegistrado] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return toast.error('Completa todos los campos')
    if (isRegister && (!nombre || !apellido)) return toast.error('Ingresa tu nombre y apellido')
    setLoading(true)
    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { nombre, apellido } }
      })
      if (error) { toast.error(error.message); setLoading(false); return }
      setRegistrado(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error(error.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-input)',
    border: '1px solid var(--border-input)', borderRadius: '12px',
    padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)',
    outline: 'none', transition: 'all 0.2s'
  }

  if (registrado) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm px-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl"
          style={{ background: 'var(--accent-gradient)' }}>
          ✉️
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Revisa tu correo</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Enviamos un enlace de verificación a{' '}
          <span style={{ color: 'var(--accent)' }}>{email}</span>.
        </p>
        <div className="p-4 rounded-2xl text-left"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            📬 Abre el correo y haz clic en el enlace de confirmación — te llevará directo al dashboard.
            <br /><br />
            ¿No lo ves? Revisa tu carpeta de <strong style={{ color: 'var(--text-primary)' }}>spam</strong>.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-card)' }
      }} />

      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <img src="/icons/icon-192.png" alt="StockFlow"
            style={{ width: '52px', height: '52px', borderRadius: '16px', objectFit: 'cover', margin: '0 auto 16px' }} />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>StockFlow</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </p>
        </div>

        <div className="space-y-3 p-6 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', backdropFilter: 'blur(20px)' }}>

          {isRegister && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Juan" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Apellido</label>
                <input value={apellido} onChange={e => setApellido(e.target.value)}
                  placeholder="Pérez" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="tu@email.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all mt-1"
            style={{ background: 'var(--accent-gradient)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button onClick={() => { setIsRegister(!isRegister); setNombre(''); setApellido('') }}
            style={{ color: 'var(--accent)' }} className="font-medium hover:underline">
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}