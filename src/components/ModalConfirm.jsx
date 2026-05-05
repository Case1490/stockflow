import { AlertTriangle } from 'lucide-react'

export default function ModalConfirm({ titulo, mensaje, onConfirmar, onCancelar, cargando = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'rgba(20,16,50,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.2)' }}>
            <AlertTriangle size={16} style={{ color: '#fb7185' }} />
          </div>
          <h3 className="text-sm font-semibold text-white">{titulo}</h3>
        </div>

        <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          {mensaje}
        </p>

        <div className="flex gap-2">
          <button onClick={onCancelar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-xs transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(251,113,133,0.2)', border: '1px solid rgba(251,113,133,0.3)', color: '#fb7185', opacity: cargando ? 0.5 : 1 }}>
            {cargando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}