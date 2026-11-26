// Revisa, ANTES de borrar public/audios, que cada audio de esa carpeta ya exista en el servidor.
// Si todos existen, borrar la carpeta no cambia nada para la app.
// Uso:  node scripts/verificar-audios.mjs            (revisa https://olo.tail0de9ec.ts.net)
//       node scripts/verificar-audios.mjs https://otro-servidor
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SERVIDOR = (process.argv[2] || 'https://olo.tail0de9ec.ts.net').replace(/\/$/, '')
const CARPETA = fileURLToPath(new URL('../public/audios/', import.meta.url))

if (!existsSync(CARPETA)) {
  console.log('No existe public/audios: ya se borró. La app usa los audios del servidor.')
  process.exit(0)
}

// Todos los archivos de audio dentro de public/audios -> "/audios/familia/…/padre.m4a"
function recorrer(dir, lista = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) recorrer(ruta, lista)
    else if (/\.(m4a|mp3|ogg|wav|webm|aac)$/i.test(nombre)) lista.push('/audios/' + relative(CARPETA, ruta).split(sep).join('/'))
  }
  return lista
}
const lista = recorrer(CARPETA).sort()
console.log(`Revisando los ${lista.length} audios de public/audios en ${SERVIDOR} …\n`)

const faltan = []
let revisados = 0
async function revisar(ruta) {
  try {
    const r = await fetch(SERVIDOR + encodeURI(ruta), { method: 'HEAD' })
    const tipo = r.headers.get('content-type') || ''
    if (!r.ok || tipo.includes('text/html')) faltan.push(ruta)
  } catch (err) {
    faltan.push(`${ruta}  (error: ${err.message})`)
  }
  revisados += 1
  if (revisados % 50 === 0) console.log(`  … ${revisados}/${lista.length}`)
}
// de 8 en 8 para no saturar el servidor
for (let i = 0; i < lista.length; i += 8) await Promise.all(lista.slice(i, i + 8).map(revisar))

if (faltan.length) {
  console.log(`\n❌ ${faltan.length} de ${lista.length} audios de public/audios NO están en el servidor:`)
  faltan.forEach((f) => console.log('   ' + f))
  console.log('\nNo borres public/audios todavía: primero súbelos al servidor (misma ruta).')
  process.exit(1)
}
console.log(`\n✅ Los ${lista.length} audios de public/audios ya están en el servidor. Ya se puede borrar la carpeta.`)
