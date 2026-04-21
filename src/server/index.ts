import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleGetConfig, handleSaveConfig, handleStatus, refreshAll } from './api-handler.js'
import { renderHTML } from './template.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getPackageVersion(): string {
  try {
    const possiblePaths = [
      join(__dirname, '..', '..', 'package.json'),
      join(process.cwd(), 'package.json'),
    ]
    for (const pkgPath of possiblePaths) {
      try {
        const content = readFileSync(pkgPath, 'utf-8')
        const pkg = JSON.parse(content) as { version?: string }
        if (pkg.version) return pkg.version
      } catch {
        // Try next path
      }
    }
  } catch {
    // Fall through
  }
  return '1.0.0'
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function sendJSON(res: ServerResponse, data: unknown, statusCode = 200): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function sendHTML(res: ServerResponse, html: string): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname
  const method = req.method || 'GET'

  // CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    // API routes
    if (path === '/api/status' && method === 'GET') {
      const result = await handleStatus()
      sendJSON(res, result)
      return
    }

    if (path === '/api/refresh' && method === 'POST') {
      const result = await refreshAll()
      sendJSON(res, result)
      return
    }

    if (path === '/api/config' && method === 'GET') {
      const result = handleGetConfig()
      sendJSON(res, result)
      return
    }

    if (path === '/api/config' && method === 'PUT') {
      const body = await parseBody(req)
      const config = JSON.parse(body) as Record<string, string>
      const result = handleSaveConfig({
        anthropic_api_key: config.anthropic_api_key || '',
        claude_token: config.claude_token || '',
        gemini_api_key: config.gemini_api_key || '',
        openai_api_key: config.openai_api_key || '',
        ollama_session_cookie: config.ollama_session_cookie || '',
      })
      sendJSON(res, result)
      return
    }

    // Serve the web UI for root path
    if (path === '/' || path === '/index.html') {
      const version = getPackageVersion()
      const html = renderHTML().replace('id="version">?</span>', `id="version">${version}</span>`)
      sendHTML(res, html)
      return
    }

    // 404
    sendJSON(res, { error: 'Not found' }, 404)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[ERROR] ${method} ${path}: ${message}\n`)
    sendJSON(res, { error: message }, 500)
  }
}

export function startServer(port?: number): void {
  const serverPort = port || parseInt(process.env.PORT || '3000', 10)

  const server = createServer(handleRequest)

  server.listen(serverPort, () => {
    process.stdout.write(
      `🚀 AI Usage Monitor web server running at http://localhost:${serverPort}\n`
    )
    process.stdout.write('   Press Ctrl+C to stop\n')
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write(
        `Port ${serverPort} is already in use. Try a different port with PORT=<port>\n`
      )
      process.exit(1)
    } else {
      process.stderr.write(`Server error: ${err.message}\n`)
      process.exit(1)
    }
  })
}

// Auto-start when run directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMainModule) {
  startServer()
}
