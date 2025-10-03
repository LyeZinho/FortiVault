import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar se o backend está acessível
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'
    
    let backendStatus = 'unknown'
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        backendStatus = 'healthy'
      } else {
        backendStatus = 'unhealthy'
      }
    } catch (error) {
      backendStatus = 'unreachable'
    }

    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'fortivault-frontend',
      version: '1.0.0',
      environment: 'production',
      backend: {
        status: backendStatus,
        url: backendUrl
      }
    }

    return NextResponse.json(healthInfo, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'fortivault-frontend'
    }, { status: 500 })
  }
}

// Suporte a outros métodos HTTP para monitoramento
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}