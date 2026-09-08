import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

async function proxyRequest(req: NextRequest, method: string) {
  const target = `${API_BASE}${req.nextUrl.pathname.replace(/^\/api\/v1/, '')}${req.nextUrl.search}`

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
      headers.set(key, value)
    }
  })

  const init: RequestInit = { method, headers, cache: 'no-store' }
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await req.arrayBuffer()
    init.body = body
    headers.set('content-length', String(body.byteLength))
  }

  const res = await fetch(target, init)
  const resHeaders = new Headers()
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'transfer-encoding') {
      resHeaders.set(key, value)
    }
  })

  return new NextResponse(res.body, { status: res.status, headers: resHeaders })
}

export async function GET(req: NextRequest) { return proxyRequest(req, 'GET') }
export async function POST(req: NextRequest) { return proxyRequest(req, 'POST') }
export async function PUT(req: NextRequest) { return proxyRequest(req, 'PUT') }
export async function PATCH(req: NextRequest) { return proxyRequest(req, 'PATCH') }
export async function DELETE(req: NextRequest) { return proxyRequest(req, 'DELETE') }
