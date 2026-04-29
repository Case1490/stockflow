import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

export default function Layout({ session }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/productos', label: 'Productos', icon: <Package size={15} /> },
    { to: '/ventas', label: 'Ventas', icon: <ShoppingCart size={15} /> },
  ]

  return (
    <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29, #1a1040, #24243e)' }}>
      <Toaster position="top-right" toastOptions={{
        style: {
          borderRadius: '12px', fontSize: '13px', padding: '12px 16px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)',
          color: '#fff', border: '1px solid rgba(255,255,255,0.15)'
        },
        success: { iconTheme: { primary: '#2dd4bf', secondary: '#0f0c29' } },
        error: { iconTheme: { primary: '#fb7185', secondary: '#0f0c29' } },
      }} />

      {/* Sidebar */}
      <aside className="w-56 flex flex-col py-5 px-3"
        style={{ background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="px-3 pb-4 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)' }}>
              📦
            </div>
            <span className="text-sm font-semibold text-white">StockFlow</span>
          </div>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{session.user.email}</p>
        </div>

        <nav className="flex-1 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={({ isActive }) => isActive
                ? { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }
                : { color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 w-full text-xs rounded-xl transition-all"
            style={{ color: 'rgba(251,113,133,0.6)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,113,133,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}