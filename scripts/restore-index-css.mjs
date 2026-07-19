import fs from 'fs'
import path from 'path'

const stylesDir = 'src/styles'

function read(name) {
  return fs.readFileSync(path.join(stylesDir, name), 'utf8')
}

const tokensRaw = read('tokens.css')
const varMap = {}
for (const m of tokensRaw.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
  varMap['--' + m[1]] = m[2].trim()
}

function resolve(value, depth = 0) {
  const v = value.trim()
  if (depth > 12) return v
  const match = v.match(/^var\((--[^,)]+)\)$/)
  if (match && varMap[match[1]]) return resolve(varMap[match[1]], depth + 1)
  return v
}

for (const key of Object.keys(varMap)) {
  varMap[key] = resolve(varMap[key])
}

function subst(css) {
  let out = css.replace(/@import[^;]+;/g, '')
  for (let i = 0; i < 6; i++) {
    out = out.replace(/var\((--[^,)]+)\)/g, (_, name) => varMap[name] ?? `var(${name})`)
  }
  return out
}

const bootstrap = fs.readFileSync('scripts/bootstrap.css', 'utf8')

const files = ['base.css', 'components.css', 'workspace.css', 'settings.css', 'pma-forms.css', 'scheda.css']
let merged = files.map((f) => subst(read(f))).join('\n\n')

merged = merged.replace(/\/\* Chip choice[\s\S]*?(?=\/\* Form grid)/, '')
merged = merged.replace(/\.codice-colore-choice[\s\S]*?(?=\/\* PDF — documento)/, '')
merged = merged.replace(/\.empty-state[\s\S]*?(?=\/\* Parametri vitali)/, '')
merged = merged.replace(/\.scheda-page \.card h3,[\s\S]*?(?=\/\* Tab navigazione)/, '')

merged = merged.replace(/\.chip-btn-active/g, '.choice-btn-active')
merged = merged.replace(/\.chip-btn/g, '.choice-btn')
merged = merged.replace(/\.chip-choice/g, '.choice-buttons')

merged = merged.replace(
  /\.drop-zone-no-bed \{[^}]+\}/,
  `.drop-zone-no-bed {
  border-color: #34d399;
  background: #ecfdf5;
}`,
)

merged = merged.replace(
  /\.bed-item-empty \{[^}]+\}/,
  `.bed-item-empty {
  background: #f0fdf4;
  border-color: #22c55e;
}`,
)

merged = merged.replace(
  /\.bed-item-occupied \{[^}]+\}/,
  `.bed-item-occupied {
  background: #dbeafe;
  border-color: #2563eb;
}`,
)

// Original tab/button typography from pre-refactor
merged = merged.replace(
  /\.tab-btn-active \{[^}]+\}/,
  `.tab-btn-active {
  background: #145da0;
  border-color: #145da0;
  color: white;
}`,
)

merged = merged.replace(
  /\.tab-btn \{[^}]+\}/,
  `.tab-btn {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  border-radius: 8px;
  padding: 0.55rem 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
}`,
)

merged = merged.replace(
  /\.choice-btn-active \{[^}]+\}/,
  `.choice-btn-active {
  background: #145da0;
  border-color: #145da0;
  color: white;
}`,
)

merged = merged.replace(
  /\.choice-btn \{[^}]+\}/,
  `.choice-btn {
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 8px;
  padding: 0.55rem 1rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.875rem;
}`,
)

// Codice colore clinical overrides
const codiceColore = `
.codice-colore-buttons {
  gap: 0.75rem;
}

.codice-colore-btn {
  min-width: 3rem;
  font-weight: 800;
}

.codice-colore-b {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.codice-colore-b.choice-btn-active {
  background: #e2e8f0;
  border-color: #475569;
  color: #0f172a;
}

.codice-colore-v {
  background: #ecfdf5;
  border-color: #34d399;
  color: #047857;
}

.codice-colore-v.choice-btn-active {
  background: #10b981;
  border-color: #059669;
  color: #fff;
}

.codice-colore-g {
  background: #fefce8;
  border-color: #facc15;
  color: #a16207;
}

.codice-colore-g.choice-btn-active {
  background: #eab308;
  border-color: #ca8a04;
  color: #fff;
}

.codice-colore-r {
  background: #fef2f2;
  border-color: #f87171;
  color: #b91c1c;
}

.codice-colore-r.choice-btn-active {
  background: #ef4444;
  border-color: #dc2626;
  color: #fff;
}
`

const btnOverride = `
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: transform 0.1s ease, opacity 0.1s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #145da0;
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-danger {
  background: #dc2626;
  color: white;
}
`

const output = `${bootstrap}\n\n${merged}\n\n${codiceColore}\n\n${btnOverride}\n`
fs.writeFileSync('src/index.css', output)
console.log('Wrote src/index.css', output.length, 'chars')
