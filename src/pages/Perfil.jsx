import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerfil } from '../hooks/usePerfil'
import { Camera, Save, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'

const glass = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none' }

export default function Perfil({ session }) {
  const { perfil, loading, actualizarPerfil, subirAvatar } = usePerfil(session.user.id)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [preview, setPreview] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [iniciado, setIniciado] = useState(false)

  // Inicializar form con datos del perfil
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

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-32 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Mi perfil</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Gestiona tu información personal</p>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl p-6 mb-4 flex items-center gap-5" style={glass}>
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar"
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: '2px solid rgba(45,212,191,0.3)' }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-semibold"
              style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#fff' }}>
              {iniciales}
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)' }}>
            <Camera size={13} className="text-white" />
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>
        </div>
        <div>
          <p className="font-medium text-white">{nombre || 'Sin nombre'} {apellido}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{session.user.email}</p>
          <p className="text-xs mt-2 px-2 py-0.5 rounded-full inline-block"
            style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}>
            Administrador
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl p-6 space-y-4" style={glass}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Nombre</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Juan" style={{ ...inputStyle, paddingLeft: '32px' }}
                onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Apellido</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input value={apellido} onChange={e => setApellido(e.target.value)}
                placeholder="Pérez" style={{ ...inputStyle, paddingLeft: '32px' }}
                onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input value={session.user.email} disabled
              style={{ ...inputStyle, paddingLeft: '32px', opacity: 0.4, cursor: 'not-allowed' }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>El email no se puede cambiar</p>
        </div>

        <button onClick={handleGuardar} disabled={guardando}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', opacity: guardando ? 0.6 : 1 }}>
          <Save size={15} />
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}