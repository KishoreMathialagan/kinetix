import { appendFile } from 'node:fs/promises'
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
const LOG_FILE = process.cwd() + '/web-requests.log'

async function capture(req: NextRequest, responseStatus: number) {
  try {
    await appendFile(
      LOG_FILE,
      `${new Date().toISOString()} ${req.method} ${req.nextUrl.pathname} -> proxied to ${API_BASE} (${responseStatus})\n`,
    )
  } catch {}
}

export async function GET(req: NextRequest) {
  const target = `${API_BASE}${req.nextUrl.pathname.replace(/^\/api\/v1/, '')}${req.nextUrl.search}`
  const res = await fetch(target, { headers: req.headers, cache: 'no-store' })
  await capture(req, res.status)
  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}

export async function POST(req: NextRequest) {
  const target = `${API_BASE}${req.nextUrl.pathname.replace(/^\/api\/v1/, '')}${req.nextUrl.search}`
  const res = await fetch(target, {
    method: 'POST',
    headers: req.headers,
    body: req.body,
    cache: 'no-store',
  })
  await capture(req, res.status)
  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}

export async function PUT(req: NextRequest) {
  const target = `${API_BASE}${req.nextUrl.pathname.replace(/^\/api\/v1/, '')}${req.nextUrl.search}`
  const res = await fetch(target, {
    method: 'PUT',
    headers: req.headers,
    body: req.body,
    cache: 'no-store',
  })
  await capture(req, res.status)
  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}

export async function PATCH(req: NextRequest) {
  const target = `${API_BASE}${req.nextUrl.pathname.replace(/^\/api\/v1/, '')}${req.nextUrl.search}`
  const res = await fetch(target, {
    method: 'PATCH',
    headers: req.headers,
    body: req.body,
    cache: 'no-store',
  })
  await capture(req, res.status)
  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}

export async function DELETE(req: NextRequest) {
  const target = `${API_BASE}${req.nextUrl.pathname.replace(/^\/api\/v1/, '')}${req.nextUrl.search}`
  const res = await fetch(target, {
    method: 'DELETE',
    headers: req.headers,
    cache: 'no-store',
  })
  await capture(req, res.status)
  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}
