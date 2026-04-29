import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ShoppingCart, Package, AlertTriangle, TrendingUp } from 'lucide-react'

const glass = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }

export default function Dashboard() {
  const [stats, setStats] = useState({ totalVentasHoy: 0, totalVentasMes: 0, totalProductos: 0, stockBajo: 0 })
  const [grafica, setGrafica] = useState([])
  const [productosTop, setProductosTop] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDatos()
    const channel = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, fetchDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, fetchDatos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchDatos = async () => {
    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

    const [{ data: ventasHoy }, { data: ventasMes }, { data: productos }, { data: topData }, { data: ventasSemana }] =
      await Promise.all([
        supabase.from('ventas').select('total').gte('created_at', inicioHoy),
        supabase.from('ventas').select('total').gte('created_at', inicioMes),
        supabase.from('productos').select('stock, stock_minimo'),
        supabase.from('ventas').select('cantidad, productos(nombre)').gte('created_at', inicioMes),
        supabase.from('ventas').select('total, created_at').gte('created_at', new Date(ahora - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])

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

    const conteo = {}
    topData?.forEach(v => {
      const nombre = v.productos?.nombre || 'Desconocido'
      conteo[nombre] = (conteo[nombre] || 0) + v.cantidad
    })
    setProductosTop(Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, cantidad]) => ({ nombre, cantidad })))

    setStats({
      totalVentasHoy: ventasHoy?.reduce((acc, v) => acc + Number(v.total), 0) || 0,
      totalVentasMes: ventasMes?.reduce((acc, v) => acc + Number(v.total), 0) || 0,
      totalProductos: productos?.length || 0,
      stockBajo: productos?.filter(p => p.stock <= p.stock_minimo).length || 0
    })
    setLoading(false)
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
    { label: 'Ventas hoy', value: `S/ ${stats.totalVentasHoy.toFixed(2)}`, icon: <ShoppingCart size={15} />, color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)' },
    { label: 'Ventas este mes', value: `S/ ${stats.totalVentasMes.toFixed(2)}`, icon: <TrendingUp size={15} />, color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)' },
    { label: 'Productos', value: stats.totalProductos, icon: <Package size={15} />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    { label: 'Stock bajo', value: stats.stockBajo, icon: <AlertTriangle size={15} />, color: '#fb7185', bg: 'rgba(251,113,133,0.15)', alert: stats.stockBajo > 0 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background: 'rgba(15,12,41,0.9)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#fff' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</p>
        <p style={{ color: '#2dd4bf', fontWeight: 600 }}>S/ {Number(payload[0].value).toFixed(2)}</p>
      </div>
    )
    return null
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Dashboard</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Resumen de tu negocio en tiempo real</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tarjetas.map((t, i) => (
          <div key={i} className="rounded-2xl p-4" style={{
            ...glass,
            ...(t.alert ? { border: '1px solid rgba(251,113,133,0.3)', background: 'rgba(251,113,133,0.08)' } : {})
          }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: t.bg, color: t.color }}>
              {t.icon}
            </div>
            <p className="text-lg font-semibold text-white">{t.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={glass}>
          <p className="text-xs font-medium mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Ventas últimos 7 días</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={grafica} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="url(#tealGrad)" />
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={glass}>
          <p className="text-xs font-medium mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Top productos este mes</p>
          {productosTop.length === 0 ? (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Sin ventas este mes</p>
          ) : (
            <div className="space-y-3.5">
              {productosTop.map((p, i) => {
                const max = productosTop[0].cantidad
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="truncate max-w-[130px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.nombre}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{p.cantidad} und.</span>
                    </div>
                    <div className="w-full rounded-full h-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-1 rounded-full transition-all" style={{ width: `${(p.cantidad / max) * 100}%`, background: 'linear-gradient(90deg, #0d9488, #2dd4bf)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}