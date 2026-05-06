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
            ? { background: 'var(--bg-pill-active)', color: 'var(--text-nav-active)', border: '1px solid var(--border-pill-active)' }
            : { background: 'var(--bg-pill-idle)', color: 'var(--text-secondary)', border: '1px solid var(--border-pill-idle)' }
          }>
          {op.label}
        </button>
      ))}
    </div>
  )
}