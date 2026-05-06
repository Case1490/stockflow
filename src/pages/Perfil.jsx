import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerfil } from '../hooks/usePerfil'
import { useTema } from '../context/ThemeContext'
import { Camera, Save, Mail, User, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Perfil({ session }) {
  const { perfil, loading, actualizarPerfil, subirAvatar } = usePerfil(session.user.id)
  const { isDark, toggleTema } = useTema()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [preview, setPreview] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [iniciado, setIniciado] = useState(false)

  if (perfil && !iniciado) {
    setNombre(perfil.nombre || session.user.user_metadata?.nombre || '')
    setApellido(perfil.apellido || session.user.user_metadata?.apellido || '')
    setIniciado(true)
  }

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleGuardar = async () => {
    setGuardando(true)
    let avatar_url = perfil?.avatar_url || null
    if (archivo) {
      const url = await subirAvatar(archivo)
      if (url) avatar_url = url
      else { toast.error('Error al subir la imagen'); setGuardando(false); return }
    }
    const { error } = await actualizarPerfil({ nombre, apellido, avatar_url })
    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado ✓')
    setGuardando(false)
  }

  const avatarUrl = preview || perfil?.avatar_url
  const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?'

  const inputStyle = {
    width: '100%', background: 'var(--bg-input)',
    border: '1px solid var(--border-input)', borderRadius: '12px',
    padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none'
  }

  if (loading) return (
    <div className="space-y-4 max-w-lg">
      <div className="h-8 w-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
    </div>
  )

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Mi perfil</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Gestiona tu información personal</p>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl p-6 mb-4 flex items-center gap-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar"
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: '2px solid var(--accent-border)' }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-semibold text-white"
              style={{ background: 'var(--accent-gradient)' }}>
              {iniciales}
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-white"
            style={{ background: 'var(--accent-gradient)' }}>
            <Camera size={13} />
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{nombre || 'Sin nombre'} {apellido}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{session.user.email}</p>
          <p className="text-xs mt-2 px-2 py-0.5 rounded-full inline-block"
            style={perfil?.rol === 'admin'
              ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
              : { background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }
            }>
            {perfil?.rol === 'admin' ? 'Administrador' : 'Vendedor'}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Nombre</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Juan" style={{ ...inputStyle, paddingLeft: '32px' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Apellido</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={apellido} onChange={e => setApellido(e.target.value)}
                placeholder="Pérez" style={{ ...inputStyle, paddingLeft: '32px' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email</label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={session.user.email} disabled
              style={{ ...inputStyle, paddingLeft: '32px', opacity: 0.4, cursor: 'not-allowed' }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>El email no se puede cambiar</p>
        </div>

        {/* Toggle tema */}
        <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Apariencia</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isDark
                ? <Moon size={15} style={{ color: 'var(--accent)' }} />
                : <Sun size={15} style={{ color: 'var(--amber)' }} />
              }
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {isDark ? 'Modo oscuro' : 'Modo claro'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cambia la apariencia de la app</p>
              </div>
            </div>
            <button onClick={toggleTema} style={{
              width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: isDark ? 'var(--accent)' : '#cbd5e1', position: 'relative', transition: 'all 0.3s'
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '3px', transition: 'all 0.3s',
                left: isDark ? '23px' : '3px'
              }} />
            </button>
          </div>
        </div>

        <button onClick={handleGuardar} disabled={guardando}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: 'var(--accent-gradient)', opacity: guardando ? 0.6 : 1 }}>
          <Save size={15} />
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}