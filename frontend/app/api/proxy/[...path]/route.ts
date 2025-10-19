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
    console.log(`[Proxy] ${method} ${fullUrl}`)
    
    const headers: HeadersInit = {}
    
    // Получаем Content-Type
    const contentType = request.headers.get('content-type')
    const isMultipartFormData = contentType?.includes('multipart/form-data')
    
    // Для multipart/form-data копируем Content-Type header с boundary
    if (contentType) {
      headers['Content-Type'] = contentType
    }
    
    const authorization = request.headers.get('authorization')
    if (authorization) {
      headers['Authorization'] = authorization
    }

    // Получаем тело запроса для POST/PUT
    let body: any = undefined
    if (method === 'POST' || method === 'PUT') {
      if (isMultipartFormData) {
        // Для FormData используем arrayBuffer для точной передачи бинарных данных
        const buffer = await request.arrayBuffer()
        body = Buffer.from(buffer)
      } else {
        // Для JSON используем text()
        body = await request.text()
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(30000), // 30 секунд таймаут
    })

    const data = await response.json()
    
    console.log(`[Proxy] Response status: ${response.status}`)
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('[Proxy] Error:', error.message, error.cause)
    return NextResponse.json(
      { error: 'Failed to proxy request', details: error.message },
      { status: 500 }
    )
  }
}



