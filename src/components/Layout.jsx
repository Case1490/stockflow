import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LayoutDashboard, Package, ShoppingCart, LogOut, UserCircle, Users } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import InstallPWA from './InstallPWA'
import { useEffect, useState } from 'react'
import { useTema } from '../context/ThemeContext'

export default function Layout({ session, rol }) {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const esAdmin = rol === 'admin'
  const { isDark } = useTema()

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/productos', label: 'Productos', icon: <Package size={15} /> },
    { to: '/ventas', label: 'Ventas', icon: <ShoppingCart size={15} /> },
    { to: '/perfil', label: 'Mi perfil', icon: <UserCircle size={15} /> },
    ...(esAdmin ? [{ to: '/usuarios', label: 'Usuarios', icon: <Users size={15} /> }] : []),
  ]

  const SidebarContent = () => (
    <>
      <div style={{ padding: '0 12px 16px', marginBottom: '8px', borderBottom: `1px solid var(--border-sidebar)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <img src="/icons/icon-192.png" alt="StockFlow" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>StockFlow</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-light)' }}>
              {esAdmin ? 'Administrador' : 'Vendedor'}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</p>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '12px', fontSize: '12px',
              fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
              ...(isActive
                ? { background: 'var(--bg-nav-active)', color: 'var(--text-nav-active)', border: `1px solid var(--border-nav-active)` }
                : { color: 'var(--text-nav-idle)', border: '1px solid transparent' })
            })}>
            {item.icon}{item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ paddingTop: '12px', borderTop: `1px solid var(--border-sidebar)` }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          width: '100%', borderRadius: '12px', fontSize: '12px', background: 'transparent',
          border: 'none', color: 'var(--danger)', cursor: 'pointer'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--bg-app)' }}>
      <Toaster position="top-right" toastOptions={{
        style: {
          borderRadius: '12px', fontSize: '13px', padding: '12px 16px',
          background: isDark ? 'rgba(255,255,255,0.1)' : '#fff',
          backdropFilter: 'blur(20px)',
          color: 'var(--text-primary)',
          border: `1px solid var(--border-card)`
        },
        success: { iconTheme: { primary: '#3b82f6', secondary: isDark ? '#050d1a' : '#fff' } },
        error: { iconTheme: { primary: 'var(--danger)', secondary: isDark ? '#050d1a' : '#fff' } },
      }} />

      {!isMobile && (
        <aside style={{
          width: '224px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          padding: '20px 12px', background: 'var(--bg-sidebar)',
          borderRight: `1px solid var(--border-sidebar)`
        }}>
          <SidebarContent />
        </aside>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'var(--bg-sidebar)',
            borderBottom: `1px solid var(--border-sidebar)`, flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/icons/icon-192.png" alt="StockFlow" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>StockFlow</span>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
              <LogOut size={16} />
            </button>
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? '72px' : '0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
            <Outlet />
          </div>
        </main>

        {isMobile && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            display: 'flex', zIndex: 40,
            background: 'var(--bg-sidebar)',
            borderTop: `1px solid var(--border-sidebar)`,
            backdropFilter: 'blur(20px)'
          }}>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '10px 0', gap: '4px',
                  textDecoration: 'none', fontSize: '10px', transition: 'all 0.2s',
                  color: isActive ? 'var(--text-nav-active)' : 'var(--text-nav-idle)'
                })}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
      <InstallPWA />
    </div>
  )
}