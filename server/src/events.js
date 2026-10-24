// Server-Sent Events: the portfolio keeps one open request to /api/events and refetches
// its content when told something changed, so admin edits show up without a reload.

const clients = new Set()
const MAX_CLIENTS = 1000

export function eventsHandler(req, res) {
  if (clients.size >= MAX_CLIENTS) return res.status(503).json({ error: 'Too many listeners' })
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 5000\n\n')
  clients.add(res)
  req.on('close', () => clients.delete(res))
}

export function broadcast(event, data = {}) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of clients) res.write(frame)
}

// Comment lines keep idle connections from being dropped by proxies.
setInterval(() => {
  for (const res of clients) res.write(': ping\n\n')
}, 25_000).unref()
