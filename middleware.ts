import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Adicionar headers de segurança
  const response = NextResponse.next()

  // Prevenir clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevenir MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Política de referrer
  response.headers.set("Referrer-Policy", "origin-when-cross-origin")

  // Content Security Policy para segurança extra
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 ws://localhost:3000;",
  )

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
