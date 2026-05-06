import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [cambiando, setCambiando] = useState(null)

  useEffect(() => { fetchUsuarios() }, [])

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('perfiles').select('*').order('created_at', { ascending: true })
    setUsuarios(data || [])
    setLoading(false)
  }

  const cambiarRol = async (id, rolActual) => {
    setCambiando(id)
    const nuevoRol = rolActual === 'admin' ? 'vendedor' : 'admin'
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id)
    if (error) toast.error('Error al cambiar rol')
    else { toast.success(`Rol cambiado a ${nuevoRol} ✓`); fetchUsuarios() }
    setCambiando(null)
  }

  const iniciales = (nombre, apellido) =>
    `${(nombre || '?').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Usuarios</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {usuarios.length} usuarios registrados
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          {usuarios.map((u, idx) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
              borderBottom: idx < usuarios.length - 1 ? '1px solid var(--border-card)' : 'none'
            }}>
              {u.avatar_url ? (
                <img src={u.avatar_url} alt=""
                  style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 600, color: '#fff',
                  background: 'var(--accent-gradient)'
                }}>
                  {iniciales(u.nombre, u.apellido)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {u.nombre || 'Sin nombre'} {u.apellido || ''}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  Registrado {new Date(u.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>

              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                ...(u.rol === 'admin'
                  ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' })
              }}>
                {u.rol === 'admin' ? 'Admin' : 'Vendedor'}
              </span>

              <button onClick={() => cambiarRol(u.id, u.rol)} disabled={cambiando === u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '10px', fontSize: '11px',
                  fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-input)', color: 'var(--text-secondary)',
                  opacity: cambiando === u.id ? 0.5 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
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