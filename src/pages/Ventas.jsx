import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const glass = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
const inputStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 10px', fontSize: '12px', color: '#fff', outline: 'none', width: '60px', textAlign: 'center' }

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [carrito, setCarrito] = useState([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    fetchVentas()
    fetchProductos()
    const channel = supabase.channel('ventas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, fetchVentas)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchVentas = async () => {
    const { data } = await supabase
      .from('ventas').select('*, productos(nombre, precio)')
      .order('created_at', { ascending: false })
    setVentas(data || [])
    setLoading(false)
  }

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').gt('stock', 0).order('nombre')
    setProductos(data || [])
  }

  // Carrito helpers
  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id)
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          toast.error(`Máximo ${producto.stock} unidades disponibles`)
          return prev
        }
        return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { ...producto, cantidad: 1 }]
    })
  }

  const cambiarCantidad = (id, valor) => {
    const producto = productos.find(p => p.id === id)
    const cantidad = Math.max(1, Math.min(parseInt(valor) || 1, producto?.stock || 1))
    setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i))
  }

  const quitarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(i => i.id !== id))
  }

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const confirmarVenta = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío')
    setGuardando(true)

    const usuario_id = (await supabase.auth.getUser()).data.user.id

    // Insertar cada item como venta
    const inserts = carrito.map(item => ({
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      total: item.precio * item.cantidad,
      usuario_id
    }))

    const { error } = await supabase.from('ventas').insert(inserts)
    if (error) { toast.error('Error al registrar la venta'); setGuardando(false); return }

    // Descontar stock de cada producto
    await Promise.all(carrito.map(item =>
      supabase.from('productos')
        .update({ stock: item.stock - item.cantidad })
        .eq('id', item.id)
    ))

    toast.success(`Venta registrada — S/ ${totalCarrito.toFixed(2)} ✓`)
    setCarrito([])
    setCarritoOpen(false)
    setGuardando(false)
    fetchProductos()
  }

  const formatFecha = (f) => new Date(f).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const itemsEnCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Ventas</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {ventas.length} transacciones registradas
          </p>
        </div>
        <button onClick={() => setCarritoOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white relative"
          style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)' }}>
          <ShoppingCart size={14} /> Nueva venta
          {itemsEnCarrito > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: '#fb7185', fontSize: '10px' }}>
              {itemsEnCarrito}
            </span>
          )}
        </button>
      </div>

      {/* Historial de ventas */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <ShoppingCart size={40} className="mx-auto mb-3" />
          <p className="text-sm">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <table className="w-full text-xs">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['Producto', 'Cant.', 'P. Unit.', 'Total', 'Fecha'].map((h, i) => (
                  <th key={i} className={`px-5 py-3.5 font-medium uppercase tracking-wide ${i === 0 ? 'text-left' : i < 2 ? 'text-center' : 'text-right'}`}
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventas.map((v, idx) => (
                <tr key={v.id} style={{ borderBottom: idx < ventas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <td className="px-5 py-3.5 font-medium text-white">{v.productos?.nombre || '—'}</td>
                  <td className="px-5 py-3.5 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>{v.cantidad}</td>
                  <td className="px-5 py-3.5 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>S/ {Number(v.precio_unitario).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#2dd4bf' }}>S/ {Number(v.total).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatFecha(v.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Panel del carrito */}
      {carritoOpen && (
        <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="ml-auto h-full w-full max-w-lg flex flex-col"
            style={{ background: 'rgba(15,12,41,0.98)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Header carrito */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 className="text-sm font-semibold text-white">Nueva venta</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {itemsEnCarrito} {itemsEnCarrito === 1 ? 'producto' : 'productos'} en el carrito
                </p>
              </div>
              <button onClick={() => setCarritoOpen(false)}
                className="p-2 rounded-lg transition-all"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Lista de productos disponibles */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Productos disponibles</p>
              <div className="space-y-2">
                {productos.map(p => {
                  const enCarrito = carrito.find(i => i.id === p.id)
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: enCarrito ? 'rgba(45,212,191,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${enCarrito ? 'rgba(45,212,191,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-xs font-medium text-white truncate">{p.nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#2dd4bf' }}>S/ {Number(p.precio).toFixed(2)}
                          <span className="ml-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.stock} disp.</span>
                        </p>
                      </div>
                      <button onClick={() => agregarAlCarrito(p)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: enCarrito ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.08)', color: enCarrito ? '#2dd4bf' : 'rgba(255,255,255,0.6)' }}>
                        <Plus size={11} /> {enCarrito ? `Agregar (${enCarrito.cantidad})` : 'Agregar'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Carrito actual */}
              {carrito.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>En el carrito</p>
                  <div className="space-y-2">
                    {carrito.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{item.nombre}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            S/ {(item.precio * item.cantidad).toFixed(2)}
                          </p>
                        </div>
                        <input
                          type="number" min="1" max={item.stock}
                          value={item.cantidad}
                          onChange={e => cambiarCantidad(item.id, e.target.value)}
                          style={inputStyle}
                        />
                        <button onClick={() => quitarDelCarrito(item.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: '#fb7185', background: 'rgba(251,113,133,0.1)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con total */}
            <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {carrito.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                  <span className="text-2xl font-semibold" style={{ color: '#2dd4bf' }}>
                    S/ {totalCarrito.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setCarritoOpen(false) }}
                  className="flex-1 py-2.5 rounded-xl text-xs transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                  Cancelar
                </button>
                <button onClick={confirmarVenta} disabled={guardando || carrito.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', opacity: (guardando || carrito.length === 0) ? 0.5 : 1 }}>
                  {guardando ? 'Registrando...' : `Confirmar venta`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}