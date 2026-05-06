import { AlertTriangle } from 'lucide-react'

export default function ModalConfirm({ titulo, mensaje, onConfirmar, onCancelar, cargando = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'var(--bg-modal)', border: '1px solid var(--border-modal)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo}</h3>
        </div>
        <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{mensaje}</p>
        <div className="flex gap-2">
          <button onClick={onCancelar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-xs transition-all"
            style={{ border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', opacity: cargando ? 0.5 : 1 }}>
            {cargando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}