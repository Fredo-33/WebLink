const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'data')

fs.mkdirSync(outDir, { recursive: true })

for (const name of ['nodeInfo', 'nodeInfo2']) {
  const source = fs.readFileSync(path.join(root, 'lib', `${name}.js`), 'utf8')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/m, '')

  const { NodeInfo, Trans, Relais } = new Function(`${source}\nreturn { NodeInfo, Trans, Relais }`)()

  const trans = Object.fromEntries(Object.entries(Trans).filter(([, v]) => typeof v === 'string'))
  const data = { nodeInfo: NodeInfo, trans, relais: Relais }

  const target = path.join(outDir, `${name}.json`)
  fs.writeFileSync(`${target}.tmp`, JSON.stringify(data))
  fs.renameSync(`${target}.tmp`, target)

  console.log(`${name}.json : ${Object.keys(NodeInfo).length} nodes, ${Object.keys(trans).length} noms, ${Relais.length} relais`)
}