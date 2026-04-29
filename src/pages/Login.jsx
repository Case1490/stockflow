import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Package } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return toast.error('Completa todos los campos')
    setLoading(true)
    const { error } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    else if (isRegister) toast.success('Cuenta creada, ya puedes ingresar')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#fff',
    outline: 'none', transition: 'all 0.2s'
  }

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
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="tu@email.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all mt-1"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button onClick={() => setIsRegister(!isRegister)} style={{ color: '#2dd4bf' }} className="font-medium hover:underline">
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}