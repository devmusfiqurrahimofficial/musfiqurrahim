// Server-Sent Events (SSE) broadcaster for Next.js

type ClientController = ReadableStreamDefaultController<Uint8Array>
const clients = new Set<ClientController>()
const encoder = new TextEncoder()
const MAX_CLIENTS = 1000

export function addClient(controller: ClientController): boolean {
  if (clients.size >= MAX_CLIENTS) return false
  clients.add(controller)
  try {
    controller.enqueue(encoder.encode('retry: 5000\n\n'))
  } catch {
    clients.delete(controller)
  }
  return true
}

export function removeClient(controller: ClientController) {
  clients.delete(controller)
}

export function broadcast(event: string, data: Record<string, unknown> = {}) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  const encoded = encoder.encode(frame)
  for (const client of clients) {
    try {
      client.enqueue(encoded)
    } catch {
      clients.delete(client)
    }
  }
}

// Ping interval to keep connections alive
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const ping = encoder.encode(': ping\n\n')
    for (const client of clients) {
      try {
        client.enqueue(ping)
      } catch {
        clients.delete(client)
      }
    }
  }, 25_000).unref()
}
