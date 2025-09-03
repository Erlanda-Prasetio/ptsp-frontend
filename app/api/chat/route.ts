import { NextResponse } from 'next/server'

// Allow configuring backend URL via env (e.g. RAG_API_URL=http://localhost:8001)
let BASE_RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8001'
// Normalize possible trailing slashes
BASE_RAG_API_URL = BASE_RAG_API_URL.replace(/\/$/, '')

interface RagBackendResponse {
  message: string
  sources: Array<{
    filename: string
    score: number
    content_preview: string
    path: string
  }>
  total_sources: number
  enhanced_features: Record<string, string | boolean | number>
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000) // 3 minutes for complex queries

    let response: Response | null = null
    let lastError: any = null

  // Debug: log which backend base URL we're attempting
  console.log('[chat route] Using RAG backend base URL:', BASE_RAG_API_URL)

    const attempt = async (url: string) => {
      return fetch(`${url}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: controller.signal
      })
    }

    // First attempt with provided/base URL
    try {
      response = await attempt(BASE_RAG_API_URL)
    } catch (err: any) {
      lastError = err
      // If localhost might resolve to IPv6 and backend only on IPv4, retry with 127.0.0.1
      if (BASE_RAG_API_URL.includes('localhost')) {
        const ipv4Url = BASE_RAG_API_URL.replace('localhost', '127.0.0.1')
        try {
          response = await attempt(ipv4Url)
        } catch (err2) {
          lastError = err2
        }
      }
    } finally {
      clearTimeout(timeout)
    }

    if (!response) {
      console.error('RAG fetch network failure', lastError)
      return NextResponse.json({ error: 'RAG backend unreachable', detail: String(lastError) }, { status: 503 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`RAG API error: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: 'RAG backend error' }, { status: response.status })
    }

    const data: RagBackendResponse = await response.json()

    return NextResponse.json({
      role: 'assistant',
      content: data.message,
      sources: data.sources || [],
      total_sources: data.total_sources ?? data.sources?.length ?? 0,
      enhanced_features: data.enhanced_features || {}
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}
