import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/')
  const url = `${BACKEND_URL}/${path}`
  
  // Получаем query параметры
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url

  try {
    const headers: HeadersInit = {}
    
    // Копируем важные заголовки
    const contentType = request.headers.get('content-type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }
    
    const authorization = request.headers.get('authorization')
    if (authorization) {
      headers['Authorization'] = authorization
    }

    // Получаем тело запроса для POST/PUT
    let body = undefined
    if (method === 'POST' || method === 'PUT') {
      body = await request.text()
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}



