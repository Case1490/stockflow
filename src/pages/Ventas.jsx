import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const glass = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
const inputStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 10px', fontSize: '12px', color: '#fff', outline: 'none', width: '60px', textAlign: 'center' }

export default function Ventas({ esAdmin }) {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [carrito, setCarrito] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [filtroVendedor, setFiltroVendedor] = useState('')

  useEffect(() => {
    fetchVentas()
    fetchProductos()
    if (esAdmin) fetchVendedores()
    const channel = supabase.channel('ventas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, fetchVentas)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [esAdmin])

  const fetchVentas = async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, productos(nombre, precio)')
      .order('created_at', { ascending: false })

    if (error) { console.log('ERROR:', error); setLoading(false); return }

    // Obtener nombres de perfiles por separado
    const usuarioIds = [...new Set((data || []).map(v => v.usuario_id).filter(Boolean))]
    let perfilesMap = {}
    if (usuarioIds.length > 0) {
      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido')
        .in('id', usuarioIds)
      perfilesData?.forEach(p => { perfilesMap[p.id] = p })
    }

    const ventasConPerfil = (data || []).map(v => ({
      ...v,
      perfil: perfilesMap[v.usuario_id] || null
    }))

    setVentas(ventasConPerfil)
    setLoading(false)
  }

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').gt('stock', 0).order('nombre')
    setProductos(data || [])
  }

  const fetchVendedores = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre, apellido')
      .eq('rol', 'vendedor')
      .order('nombre')
    setVendedores(data || [])
  }

  const ventasFiltradas = esAdmin && filtroVendedor
    ? ventas.filter(v => v.usuario_id === filtroVendedor)
    : ventas

  const totalFiltrado = ventasFiltradas.reduce((acc, v) => acc + Number(v.total), 0)

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

  const quitarDelCarrito = (id) => setCarrito(prev => prev.filter(i => i.id !== id))

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const confirmarVenta = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío')
    setGuardando(true)
    const usuario_id = (await supabase.auth.getUser()).data.user.id
    const inserts = carrito.map(item => ({
      producto_id: item.id,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      total: item.precio * item.cantidad,
      usuario_id
    }))
    const { error } = await supabase.from('ventas').insert(inserts)
    if (error) { toast.error('Error al registrar la venta'); setGuardando(false); return }
    await Promise.all(carrito.map(item =>
      supabase.from('productos').update({ stock: item.stock - item.cantidad }).eq('id', item.id)
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

  const exportarPDF = () => {
    const doc = new jsPDF()
    const ahora = new Date()
    const fechaStr = ahora.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })

    // Header
    doc.setFillColor(15, 12, 41)
    doc.rect(0, 0, 220, 40, 'F')
    doc.setTextColor(45, 212, 191)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('StockFlow', 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(180, 180, 200)
    doc.setFont('helvetica', 'normal')
    doc.text('Reporte de ventas', 14, 26)
    doc.text(`Generado el ${fechaStr}`, 14, 33)

    // Filtro activo
    if (filtroVendedor) {
      const vendedor = vendedores.find(v => v.id === filtroVendedor)
      if (vendedor) {
        doc.setTextColor(45, 212, 191)
        doc.text(`Vendedor: ${vendedor.nombre} ${vendedor.apellido}`, 140, 26)
      }
    }

    // Stats resumen
    doc.setFillColor(240, 240, 250)
    doc.rect(14, 45, 55, 18, 'F')
    doc.rect(74, 45, 55, 18, 'F')
    doc.rect(134, 45, 55, 18, 'F')

    doc.setTextColor(100, 100, 130)
    doc.setFontSize(8)
    doc.text('TOTAL TRANSACCIONES', 16, 51)
    doc.text('INGRESOS TOTALES', 76, 51)
    doc.text('PROMEDIO POR VENTA', 136, 51)

    doc.setTextColor(15, 12, 41)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`${ventasFiltradas.length}`, 16, 60)
    doc.text(`S/ ${totalFiltrado.toFixed(2)}`, 76, 60)
    const promedio = ventasFiltradas.length > 0 ? totalFiltrado / ventasFiltradas.length : 0
    doc.text(`S/ ${promedio.toFixed(2)}`, 136, 60)

    // Tabla
    const columnas = esAdmin
      ? ['Producto', 'Vendedor', 'Cant.', 'P. Unit.', 'Total', 'Fecha']
      : ['Producto', 'Cant.', 'P. Unit.', 'Total', 'Fecha']

    const filas = ventasFiltradas.map(v => {
      const nombreProducto = v.productos?.nombre || v.producto_nombre || 'Producto eliminado'
      const fecha = new Date(v.created_at).toLocaleDateString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
      if (esAdmin) {
        return [
          nombreProducto,
          `${v.perfil?.nombre || ''} ${v.perfil?.apellido || ''}`.trim() || '—',
          v.cantidad,
          `S/ ${Number(v.precio_unitario).toFixed(2)}`,
          `S/ ${Number(v.total).toFixed(2)}`,
          fecha
        ]
      }
      return [
        nombreProducto,
        v.cantidad,
        `S/ ${Number(v.precio_unitario).toFixed(2)}`,
        `S/ ${Number(v.total).toFixed(2)}`,
        fecha
      ]
    })

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 70,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 12, 41], textColor: [45, 212, 191], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: { 0: { cellWidth: esAdmin ? 45 : 60 } },
      foot: [[
        ...(esAdmin ? ['', '', '', '', `S/ ${totalFiltrado.toFixed(2)}`, ''] : ['', '', '', `S/ ${totalFiltrado.toFixed(2)}`, ''])
      ]],
      footStyles: { fillColor: [15, 12, 41], textColor: [45, 212, 191], fontStyle: 'bold' }
    })

    // Nombre del archivo
    const vendedorNombre = filtroVendedor
      ? vendedores.find(v => v.id === filtroVendedor)?.nombre || 'vendedor'
      : 'todos'
    doc.save(`ventas_${vendedorNombre}_${fechaStr.replace(/\//g, '-')}.pdf`)
    toast.success('Reporte exportado ✓')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Ventas</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {ventasFiltradas.length} transacciones
            {ventasFiltradas.length > 0 && (
              <span style={{ color: '#2dd4bf' }}> · S/ {totalFiltrado.toFixed(2)} total</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ventasFiltradas.length > 0 && (
            <button onClick={exportarPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf', background: 'rgba(45,212,191,0.08)' }}>
              📄 Exportar PDF
            </button>
          )}
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
      </div>

      {/* Filtro por vendedor — solo admin */}
      {esAdmin && (
        <div className="mb-4 flex items-center gap-3">
          <select
            value={filtroVendedor}
            onChange={e => setFiltroVendedor(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', padding: '8px 14px', fontSize: '12px',
              color: filtroVendedor ? '#fff' : 'rgba(255,255,255,0.4)',
              outline: 'none', appearance: 'none', cursor: 'pointer'
            }}>
            <option value="" style={{ background: '#1a1040' }}>Todos los vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id} style={{ background: '#1a1040' }}>
                {v.nombre} {v.apellido}
              </option>
            ))}
          </select>
          {filtroVendedor && (
            <button onClick={() => setFiltroVendedor('')}
              className="text-xs px-3 py-2 rounded-xl transition-all"
              style={{ border: '1px solid rgba(251,113,133,0.3)', color: '#fb7185', background: 'rgba(251,113,133,0.08)' }}>
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Tabla de ventas */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <ShoppingCart size={40} className="mx-auto mb-3" />
          <p className="text-sm">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <table className="w-full text-xs">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                <th className="px-5 py-3.5 text-left font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Producto</th>
                {esAdmin && <th className="px-5 py-3.5 text-left font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Vendedor</th>}
                <th className="px-5 py-3.5 text-center font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Cant.</th>
                <th className="px-5 py-3.5 text-right font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>P. Unit.</th>
                <th className="px-5 py-3.5 text-right font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Total</th>
                <th className="px-5 py-3.5 text-right font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map((v, idx) => (
                <tr key={v.id} style={{ borderBottom: idx < ventasFiltradas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <td className="px-5 py-3.5 font-medium">
                    {v.productos?.nombre ? (
                      // Producto aún existe
                      <span style={{ color: '#fff' }}>{v.productos.nombre}</span>
                    ) : v.producto_nombre ? (
                      // Producto eliminado pero tiene nombre guardado
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{v.producto_nombre}</span>
                        <span style={{
                          fontSize: '10px', padding: '1px 7px', borderRadius: '20px',
                          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}>eliminado</span>
                      </span>
                    ) : (
                      // Sin nombre guardado
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Producto eliminado</span>
                    )}
                  </td>
                  {esAdmin && (
                    <td className="px-5 py-3.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {v.perfil?.nombre} {v.perfil?.apellido}
                    </td>
                  )}
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
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 className="text-sm font-semibold text-white">Nueva venta</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {itemsEnCarrito} {itemsEnCarrito === 1 ? 'producto' : 'productos'} en el carrito
                </p>
              </div>
              <button onClick={() => setCarritoOpen(false)} className="p-2 rounded-lg"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
                <X size={16} />
              </button>
            </div>

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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: enCarrito ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.08)', color: enCarrito ? '#2dd4bf' : 'rgba(255,255,255,0.6)' }}>
                        <Plus size={11} /> {enCarrito ? `Agregar (${enCarrito.cantidad})` : 'Agregar'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {carrito.length > 0 && (
                <div>
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
                        <input type="number" min="1" max={item.stock} value={item.cantidad}
                          onChange={e => cambiarCantidad(item.id, e.target.value)} style={inputStyle} />
                        <button onClick={() => quitarDelCarrito(item.id)} className="p-1.5 rounded-lg"
                          style={{ color: '#fb7185', background: 'rgba(251,113,133,0.1)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {carrito.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                  <span className="text-2xl font-semibold" style={{ color: '#2dd4bf' }}>S/ {totalCarrito.toFixed(2)}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setCarritoOpen(false)} className="flex-1 py-2.5 rounded-xl text-xs"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                  Cancelar
                </button>
                <button onClick={confirmarVenta} disabled={guardando || carrito.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', opacity: (guardando || carrito.length === 0) ? 0.5 : 1 }}>
                  {guardando ? 'Registrando...' : 'Confirmar venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}