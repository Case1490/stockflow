export default function FiltroFecha({ valor, onChange }) {
  const opciones = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta semana', value: 'semana' },
    { label: 'Este mes', value: 'mes' },
    { label: 'Este año', value: 'anio' },
    { label: 'Todo', value: 'todo' },
  ]

  return (
    <div className="flex gap-1.5">
      {opciones.map(op => (
        <button key={op.value} onClick={() => onChange(op.value)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={valor === op.value
            ? { background: 'rgba(45,212,191,0.2)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }
            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
          }>
          {op.label}
        </button>
      ))}
    </div>
  )
}