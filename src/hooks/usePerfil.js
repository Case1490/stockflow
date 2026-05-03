import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function usePerfil(userId) {
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchPerfil()
  }, [userId])

  const fetchPerfil = async () => {
  const { data: perfilData } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (perfilData) {
    setPerfil(perfilData)
  } else {
    // Si no existe perfil, crearlo con los datos del registro
    const { data: { user } } = await supabase.auth.getUser()
    const meta = user?.user_metadata || {}
    const nuevo = {
      id: userId,
      nombre: meta.nombre || '',
      apellido: meta.apellido || '',
      avatar_url: null
    }
    await supabase.from('perfiles').insert(nuevo)
    setPerfil(nuevo)
  }
  setLoading(false)
}

  const actualizarPerfil = async (updates) => {
    const { error } = await supabase
      .from('perfiles')
      .upsert({ id: userId, ...updates })
    if (!error) await fetchPerfil()
    return { error }
  }

  const subirAvatar = async (archivo) => {
    const ext = archivo.name.split('.').pop()
    const path = `${userId}.${ext}`
    const { error } = await supabase.storage
      .from('avatares')
      .upload(path, archivo, { upsert: true })
    if (error) return null
    return supabase.storage.from('avatares').getPublicUrl(path).data.publicUrl
  }

  return { perfil, loading, actualizarPerfil, subirAvatar, fetchPerfil }
}