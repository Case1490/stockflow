export function getRangoFecha(filtro) {
  const ahora = new Date()
  let desde = null

  if (filtro === 'hoy') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  } else if (filtro === 'semana') {
    desde = new Date(ahora - 7 * 24 * 60 * 60 * 1000)
  } else if (filtro === 'mes') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  } else if (filtro === 'anio') {
    desde = new Date(ahora.getFullYear(), 0, 1)
  }

  return desde ? desde.toISOString() : null
}