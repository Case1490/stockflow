import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Package } from 'lucide-react'
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
        email, password,
        options: { data: { nombre, apellido } }
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
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
    padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', transition: 'all 0.2s'
  }

  const onFocus = e => e.target.style.borderColor = 'rgba(45,212,191,0.5)'
  const onBlur = e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'

  // Pantalla de verificación
  if (registrado) return (
  <div className="min-h-screen flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #0f0c29, #1a1040, #24243e)' }}>
    <div className="w-full max-w-sm px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl"
        style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)' }}>
        ✉️
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Revisa tu correo</h2>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Enviamos un enlace de verificación a{' '}
        <span style={{ color: '#2dd4bf' }}>{email}</span>.
      </p>
      <div className="p-4 rounded-2xl text-left"
        style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          📬 Abre el correo y haz clic en el enlace de confirmación — te llevará directo al dashboard automáticamente.
          <br /><br />
          ¿No lo ves? Revisa tu carpeta de <strong style={{ color: 'rgba(255,255,255,0.7)' }}>spam</strong>.
        </p>
      </div>
    </div>
  </div>
)

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0c29, #1a1040, #24243e)' }}>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
      }} />

      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)' }}>
            📦
          </div>
          <h1 className="text-2xl font-semibold text-white">StockFlow</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {isRegister ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </p>
        </div>

        <div className="space-y-3 p-6 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

          {isRegister && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Juan" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Apellido</label>
                <input value={apellido} onChange={e => setApellido(e.target.value)}
                  placeholder="Pérez" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="tu@email.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all mt-1"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button onClick={() => { setIsRegister(!isRegister); setNombre(''); setApellido('') }}
            style={{ color: '#2dd4bf' }} className="font-medium hover:underline">
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}