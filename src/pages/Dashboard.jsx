import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ShoppingCart, Package, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import FiltroFecha from '../components/FiltroFecha'
import { getRangoFecha } from '../hooks/useFiltroFecha'

export default function Dashboard({ esAdmin, session }) {
  const [stats, setStats] = useState({ totalVentasHoy: 0, totalVentasMes: 0, totalProductos: 0, stockBajo: 0, totalVendedores: 0 })
  const [grafica, setGrafica] = useState([])
  const [productosTop, setProductosTop] = useState([])
  const [vendedoresTop, setVendedoresTop] = useState([])
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState('mes')

  useEffect(() => {
    fetchDatos()
    if (esAdmin) fetchVendedores()
    const channel = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, fetchDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, fetchDatos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [esAdmin, filtroVendedor, filtroFecha])

  const fetchVendedores = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre, apellido')
      .eq('rol', 'vendedor')
      .order('nombre')
    setVendedores(data || [])
  }

  const fetchDatos = async () => {
    const ahora = new Date()
    const desde = getRangoFecha(filtroFecha) || new Date(0).toISOString()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString()

    // Base query — si es vendedor filtra por su ID, si es admin filtra por vendedor seleccionado
    const filtroId = esAdmin ? filtroVendedor : session.user.id

    const buildQuery = (query) => {
      if (filtroId) return query.eq('usuario_id', filtroId)
      return query
    }

    const [
      { data: ventasHoy },
      { data: ventasMes },
      { data: productos },
      { data: topData },
      { data: ventasSemana },
      { data: todasVentasMes }
    ] = await Promise.all([
      buildQuery(supabase.from('ventas').select('total').gte('created_at', inicioHoy)),
      buildQuery(supabase.from('ventas').select('total').gte('created_at', desde)),
      supabase.from('productos').select('stock, stock_minimo'),
      buildQuery(supabase.from('ventas').select('cantidad, productos(nombre)').gte('created_at', desde)),
      buildQuery(supabase.from('ventas').select('total, created_at').gte('created_at', desde)),
      esAdmin && !filtroVendedor
        ? supabase.from('ventas').select('usuario_id, total').gte('created_at', desde)
        : { data: null }
    ])

    // Gráfica últimos 7 días
    const dias = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ahora - i * 24 * 60 * 60 * 1000)
      const key = d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit' })
      dias[key] = 0
    }
    ventasSemana?.forEach(v => {
      const key = new Date(v.created_at).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit' })
      if (dias[key] !== undefined) dias[key] += Number(v.total)
    })
    setGrafica(Object.entries(dias).map(([dia, total]) => ({ dia, total })))

    // Top productos
    const conteo = {}
    topData?.forEach(v => {
      const nombre = v.productos?.nombre || 'Desconocido'
      conteo[nombre] = (conteo[nombre] || 0) + v.cantidad
    })
    setProductosTop(Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, cantidad]) => ({ nombre, cantidad })))

    // Top vendedores (solo admin sin filtro)
    if (esAdmin && !filtroVendedor && todasVentasMes) {
      const usuarioIds = [...new Set(todasVentasMes.map(v => v.usuario_id).filter(Boolean))]
      let perfilesMap = {}
      if (usuarioIds.length > 0) {
        const { data: perfilesData } = await supabase
          .from('perfiles')
          .select('id, nombre, apellido')
          .in('id', usuarioIds)
        perfilesData?.forEach(p => { perfilesMap[p.id] = p })
      }

      const conteoVendedores = {}
      todasVentasMes.forEach(v => {
        const perfil = perfilesMap[v.usuario_id]
        const nombre = perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() : 'Desconocido'
        if (!conteoVendedores[nombre]) conteoVendedores[nombre] = 0
        conteoVendedores[nombre] += Number(v.total)
      })
      setVendedoresTop(Object.entries(conteoVendedores).sort((a, b) => b[1] - a[1]).map(([nombre, total]) => ({ nombre, total })))
    } else {
      setVendedoresTop([])
    }

    // Stats
    const { data: perfiles } = await supabase.from('perfiles').select('id')
    setStats({
      totalVentasHoy: ventasHoy?.reduce((acc, v) => acc + Number(v.total), 0) || 0,
      totalVentasMes: ventasMes?.reduce((acc, v) => acc + Number(v.total), 0) || 0,
      totalProductos: productos?.length || 0,
      stockBajo: productos?.filter(p => p.stock <= p.stock_minimo).length || 0,
      totalVendedores: perfiles?.length || 0
    })

    setLoading(false)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background: 'var(--bg-modal)', border: '1px solid var(--accent-border)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</p>
        <p style={{ color: 'var(--accent)', fontWeight: 600 }}>S/ {Number(payload[0].value).toFixed(2)}</p>
      </div>
    )
    return null
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-40 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />)}
      </div>
    </div>
  )

  const tarjetas = [
    { label: 'Mis ventas hoy', value: `S/ ${stats.totalVentasHoy.toFixed(2)}`, icon: <ShoppingCart size={15} />, color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)' },
    { label: esAdmin && !filtroVendedor ? 'Ventas globales mes' : 'Mis ventas del mes', value: `S/ ${stats.totalVentasMes.toFixed(2)}`, icon: <TrendingUp size={15} />, color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)' },
    { label: 'Productos', value: stats.totalProductos, icon: <Package size={15} />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    ...(esAdmin
      ? [{ label: 'Vendedores', value: stats.totalVendedores, icon: <Users size={15} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' }]
      : [{ label: 'Stock bajo', value: stats.stockBajo, icon: <AlertTriangle size={15} />, color: '#fb7185', bg: 'rgba(251,113,133,0.15)', alert: stats.stockBajo > 0 }]
    ),
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {esAdmin ? 'Vista general del negocio' : 'Tu rendimiento personal'}
            </p>
          </div>
          {esAdmin && (
            <div className="flex items-center gap-2">
              <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  borderRadius: '12px', padding: '8px 14px', fontSize: '12px',
                  color: filtroVendedor ? 'var(--text-primary)' : 'var(--text-muted)',
                  outline: 'none', appearance: 'none', cursor: 'pointer'
                }}>
                <option value="" style={{ background: 'var(--bg-modal)' }}>Todos los vendedores</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id} style={{ background: 'var(--bg-modal)' }}>
                    {v.nombre} {v.apellido}
                  </option>
                ))}
              </select>
              {filtroVendedor && (
                <button onClick={() => setFiltroVendedor('')}
                  className="text-xs px-3 py-2 rounded-xl"
                  style={{ border: '1px solid var(--danger-border)', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          <FiltroFecha valor={filtroFecha} onChange={setFiltroFecha} />
        </div>
      </div>


      {/* Tarjetas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tarjetas.map((t, i) => (
          <div key={i} className="rounded-2xl p-4" style={{
            background: t.alert ? 'var(--danger-bg)' : 'var(--bg-card)',
            border: `1px solid ${t.alert ? 'var(--danger-border)' : 'var(--border-card)'}`,
            backdropFilter: 'blur(10px)'
          }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: t.bg, color: t.color }}>
              {t.icon}
            </div>
            <p className="text-lg font-semibold" style={{ color: t.alert ? 'var(--danger)' : 'var(--text-primary)' }}>{t.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfica */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', backdropFilter: 'blur(10px)' }}>
          <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
            {esAdmin && !filtroVendedor ? 'Ventas globales — últimos 7 días' : 'Mis ventas — últimos 7 días'}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={grafica} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-card)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="url(#tealGrad)" />
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Panel derecho */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', backdropFilter: 'blur(10px)' }}>
          {/* Admin sin filtro: muestra top vendedores */}
          {esAdmin && !filtroVendedor ? (
            <>
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Top vendedores este mes</p>
              {vendedoresTop.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin ventas este mes</p>
              ) : (
                <div className="space-y-3.5">
                  {vendedoresTop.map((v, i) => {
                    const max = vendedoresTop[0].total
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="truncate max-w-[130px]" style={{ color: 'var(--text-primary)' }}>{v.nombre}</span>
                          <span style={{ color: 'var(--text-muted)' }}>S/ {Number(v.total).toFixed(2)}</span>
                        </div>
                        <div className="w-full rounded-full h-1" style={{ background: 'var(--border-card)' }}>
                          <div className="h-1 rounded-full" style={{ width: `${(v.total / max) * 100}%`, background: 'var(--accent-gradient)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            /* Vendedor o admin con filtro: muestra top productos */
            <>
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Top productos este mes</p>
              {productosTop.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin ventas este mes</p>
              ) : (
                <div className="space-y-3.5">
                  {productosTop.map((p, i) => {
                    const max = productosTop[0].cantidad
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="truncate max-w-[130px]" style={{ color: 'var(--text-primary)' }}>{p.nombre}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{p.cantidad} und.</span>
                        </div>
                        <div className="w-full rounded-full h-1" style={{ background: 'var(--border-card)' }}>
                          <div className="h-1 rounded-full" style={{ width: `${(p.cantidad / max) * 100}%`, background: 'var(--accent-gradient)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stock bajo — solo admin */}
      {esAdmin && stats.stockBajo > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
          <AlertTriangle size={16} style={{ color: '#fb7185', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
            Hay <span style={{ color: '#fb7185', fontWeight: 600 }}>{stats.stockBajo} producto{stats.stockBajo > 1 ? 's' : ''}</span> con stock bajo. Revisa el inventario.
          </p>
        </div>
      )}
    </div>
  )
}