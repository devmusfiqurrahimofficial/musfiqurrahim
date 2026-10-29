// Server-Sent Events: the portfolio keeps one open request to /api/events and refetches
// its content when told something changed, so admin edits show up without a reload.

const clients = new Set()
const MAX_CLIENTS = 1000
// So one visitor can't take every slot and switch live updates off for everyone else.
const MAX_PER_IP = 20
const perIp = new Map()

export function eventsHandler(req, res) {
  const ip = req.ip
  if (clients.size >= MAX_CLIENTS || (perIp.get(ip) ?? 0) >= MAX_PER_IP) return res.status(503).json({ error: 'Too many listeners' })
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 5000\n\n')
  clients.add(res)
  perIp.set(ip, (perIp.get(ip) ?? 0) + 1)
  req.on('close', () => {
    clients.delete(res)
    const left = perIp.get(ip) - 1
    if (left > 0) perIp.set(ip, left)
    else perIp.delete(ip)
  })
}

export function broadcast(event, data = {}) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of clients) res.write(frame)
}

// Comment lines keep idle connections from being dropped by proxies.
setInterval(() => {
  for (const res of clients) res.write(': ping\n\n')
}, 25_000).unref()
