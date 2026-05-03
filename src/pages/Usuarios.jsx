import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'

const glass = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [cambiando, setCambiando] = useState(null)

  useEffect(() => { fetchUsuarios() }, [])

  const fetchUsuarios = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: true })
    setUsuarios(data || [])
    setLoading(false)
  }

  const cambiarRol = async (id, rolActual) => {
    setCambiando(id)
    const nuevoRol = rolActual === 'admin' ? 'vendedor' : 'admin'
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', id)
    if (error) toast.error('Error al cambiar rol')
    else {
      toast.success(`Rol cambiado a ${nuevoRol} ✓`)
      fetchUsuarios()
    }
    setCambiando(null)
  }

  const iniciales = (nombre, apellido) =>
    `${(nombre || '?').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Usuarios</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {usuarios.length} usuarios registrados
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          {usuarios.map((u, idx) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px',
              borderBottom: idx < usuarios.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              {/* Avatar */}
              {u.avatar_url ? (
                <img src={u.avatar_url} alt=""
                  style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 600, color: '#fff',
                  background: 'linear-gradient(135deg, #0d9488, #2dd4bf)'
                }}>
                  {iniciales(u.nombre, u.apellido)}
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                  {u.nombre || 'Sin nombre'} {u.apellido || ''}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                  Registrado {new Date(u.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>

              {/* Rol badge */}
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                ...(u.rol === 'admin'
                  ? { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' })
              }}>
                {u.rol === 'admin' ? 'Admin' : 'Vendedor'}
              </span>

              {/* Botón cambiar rol */}
              <button
                onClick={() => cambiarRol(u.id, u.rol)}
                disabled={cambiando === u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '10px', fontSize: '11px',
                  fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                  opacity: cambiando === u.id ? 0.5 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                {u.rol === 'admin' ? <User size={12} /> : <Shield size={12} />}
                {cambiando === u.id ? '...' : u.rol === 'admin' ? 'Hacer vendedor' : 'Hacer admin'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}