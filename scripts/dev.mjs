import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

mkdirSync('dist/client', { recursive: true })

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const children = [
  spawn(npx, ['wrangler', 'dev', '--port', '8787'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
  spawn(npx, ['vite', '--port', '5173'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
]

function stop() {
  for (const child of children) child.kill('SIGTERM')
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

for (const child of children) {
  child.on('exit', (code) => {
    stop()
    if (code) process.exitCode = code
  })
}
