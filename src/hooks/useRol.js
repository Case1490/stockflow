import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useRol(userId) {
    const [rol, setRol] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return
        fetchRol()
    }, [userId])

    const fetchRol = async () => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single()

        console.log('ROL DATA:', data)
        console.log('ROL ERROR:', error)
        console.log('USER ID:', userId)

        setRol(data?.rol || 'vendedor')
        setLoading(false)
    }

    const esAdmin = rol === 'admin'
    const esVendedor = rol === 'vendedor'

    return { rol, loading, esAdmin, esVendedor }
}