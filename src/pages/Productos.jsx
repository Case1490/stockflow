import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Pencil, Trash2, AlertTriangle, Package, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const glass = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '9px 14px', fontSize: '13px', color: '#fff', outline: 'none' }

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '', stock_minimo: '5', categoria: '' })
  const [imagen, setImagen] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [ordenar, setOrdenar] = useState('reciente')

  useEffect(() => {
    fetchProductos()
    const channel = supabase.channel('productos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, fetchProductos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false })
    setProductos(data || [])
    setLoading(false)
  }

  const abrirModal = (p = null) => {
    setEditando(p)
    setForm(p ? { nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, stock: p.stock, stock_minimo: p.stock_minimo, categoria: p.categoria || '' }
      : { nombre: '', descripcion: '', precio: '', stock: '', stock_minimo: '5', categoria: '' })
    setImagen(null)
    setModalOpen(true)
  }

  const subirImagen = async () => {
    if (!imagen) return null
    const ext = imagen.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('productos').upload(path, imagen)
    if (error) return null
    return supabase.storage.from('productos').getPublicUrl(path).data.publicUrl
  }

  const guardarProducto = async () => {
    if (!form.nombre || !form.precio || form.stock === '') return toast.error('Completa los campos requeridos')
    setGuardando(true)
    let imagen_url = editando?.imagen_url || null
    if (imagen) imagen_url = await subirImagen()
    const payload = { nombre: form.nombre, descripcion: form.descripcion, precio: parseFloat(form.precio), stock: parseInt(form.stock), stock_minimo: parseInt(form.stock_minimo), categoria: form.categoria, imagen_url }
    const { error } = editando
      ? await supabase.from('productos').update(payload).eq('id', editando.id)
      : await supabase.from('productos').insert(payload)
    if (error) toast.error('Error al guardar')
    else toast.success(editando ? 'Producto actualizado ✓' : 'Producto creado ✓')
    setGuardando(false)
    setModalOpen(false)
  }

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) toast.error('Error al eliminar')
    else toast.success('Producto eliminado')
  }

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))]

  const productosFiltrados = productos
    .filter(p => {
      const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
      const matchCategoria = filtroCategoria === '' || p.categoria === filtroCategoria
      return matchBusqueda && matchCategoria
    })
    .sort((a, b) => {
      if (ordenar === 'precio_asc') return a.precio - b.precio
      if (ordenar === 'precio_desc') return b.precio - a.precio
      if (ordenar === 'stock') return a.stock - b.stock
      if (ordenar === 'nombre') return a.nombre.localeCompare(b.nombre)
      return 0
    })

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Productos</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {productosFiltrados.length} de {productos.length} productos
            </p>
          </div>
          <button onClick={() => abrirModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)' }}>
            <Plus size={14} /> Nuevo producto
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
                padding: '8px 14px 8px 32px', fontSize: '12px', color: '#fff', outline: 'none'
              }}
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', padding: '8px 14px', fontSize: '12px', color: filtroCategoria ? '#fff' : 'rgba(255,255,255,0.35)',
              outline: 'none', appearance: 'none', cursor: 'pointer'
            }}>
            <option value="" style={{ background: '#1a1040' }}>Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c} style={{ background: '#1a1040' }}>{c}</option>)}
          </select>

          <select
            value={ordenar}
            onChange={e => setOrdenar(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', padding: '8px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)',
              outline: 'none', appearance: 'none', cursor: 'pointer'
            }}>
            <option value="reciente" style={{ background: '#1a1040' }}>Más recientes</option>
            <option value="nombre" style={{ background: '#1a1040' }}>Nombre A-Z</option>
            <option value="precio_asc" style={{ background: '#1a1040' }}>Precio: menor a mayor</option>
            <option value="precio_desc" style={{ background: '#1a1040' }}>Precio: mayor a menor</option>
            <option value="stock" style={{ background: '#1a1040' }}>Menor stock primero</option>
          </select>

          {(busqueda || filtroCategoria) && (
            <button
              onClick={() => { setBusqueda(''); setFiltroCategoria('') }}
              className="px-3 py-2 rounded-xl text-xs transition-all"
              style={{ border: '1px solid rgba(251,113,133,0.3)', color: '#fb7185', background: 'rgba(251,113,133,0.08)' }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <Search size={40} className="mx-auto mb-3" />
          <p className="text-sm">{busqueda || filtroCategoria ? 'Sin resultados para tu búsqueda' : 'No hay productos aún'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosFiltrados.map(p => (
            <div key={p.id} className="rounded-2xl overflow-hidden" style={glass}>
              {p.imagen_url
                ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-44 object-cover" />
                : <div className="w-full h-44 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Package size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
                </div>
              }
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-white">{p.nombre}</h3>
                    {p.categoria && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.categoria}</span>}
                  </div>
                  {p.stock <= p.stock_minimo && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.2)' }}>
                      <AlertTriangle size={10} /> Bajo
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold" style={{ color: '#2dd4bf' }}>S/ {Number(p.precio).toFixed(2)}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.stock} en stock</p>
                </div>
                <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <button onClick={() => abrirModal(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-all"
                    style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}>
                    <Pencil size={11} /> Editar
                  </button>
                  <button onClick={() => eliminarProducto(p.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-all"
                    style={{ color: '#fb7185', background: 'rgba(251,113,133,0.08)' }}>
                    <Trash2 size={11} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: 'rgba(20,16,50,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h3 className="text-sm font-semibold text-white mb-5">{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
            <div className="space-y-2.5">
              <input placeholder="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
              <input placeholder="Categoría" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={inputStyle} />
              <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ ...inputStyle, resize: 'none' }} rows={2} />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Precio *" type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} style={inputStyle} />
                <input placeholder="Stock *" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} />
                <input placeholder="Mín." type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ ...inputStyle, padding: '8px 14px' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Imagen</p>
                <input type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-xs transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                Cancelar
              </button>
              <button onClick={guardarProducto} disabled={guardando} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', opacity: guardando ? 0.6 : 1 }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}