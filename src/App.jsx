import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useRol } from './hooks/useRol'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Perfil from './pages/Perfil'
import Usuarios from './pages/Usuarios'
import Layout from './components/Layout'

export default function App() {
  const [session, setSession] = useState(undefined)
  const { rol, loading: rolLoading, esAdmin } = useRol(session?.user?.id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined || (session && rolLoading)) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-app)',
      color: 'var(--text-muted)', fontSize: '13px'
    }}>
      Cargando...
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route element={session ? <Layout session={session} rol={rol} /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard esAdmin={esAdmin} session={session} />} />
        <Route path="/productos" element={<Productos esAdmin={esAdmin} />} />
        <Route path="/ventas" element={<Ventas esAdmin={esAdmin} />} />
        <Route path="/perfil" element={<Perfil session={session} />} />
        <Route path="/usuarios" element={esAdmin ? <Usuarios /> : <Navigate to="/" />} />
      </Route>
    </Routes>
  )
}