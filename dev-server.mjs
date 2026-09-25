import { createServer } from 'node:http'
import { createReadStream, promises as fs } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = process.cwd()
const port = Number(process.env.PORT || 4173)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname.endsWith('/')) pathname += 'index.html'

  const filePath = join(root, normalize(pathname))
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('forbidden')
    return
  }

  const stat = await fs.stat(filePath).catch(() => null)
  if (!stat || stat.isDirectory()) {
    response.writeHead(404).end('not found')
    return
  }

  response.writeHead(200, {
    'Content-Type': types[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  })
  createReadStream(filePath).pipe(response)
}).listen(port, () => {
  console.log(`mini-x6-go dev server: http://localhost:${port}/`)
})
