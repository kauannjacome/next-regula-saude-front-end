import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const sessionToken = request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token')

  // Nota: O middleware Edge verifica apenas existência do cookie para redirecionamento de UX.
  // A validação real da sessão (JWT) acontece em cada API route via auth().
  // Isso é padrão aceitável no NextAuth com JWT strategy no Edge Runtime.
  const isLoggedIn = !!sessionToken

  // Páginas públicas que não precisam de autenticação
  const isPublicPage = pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/unlock-account') ||
    pathname.startsWith('/register')

  // Se é página pública (inclui /), permitir acesso sempre
  if (isPublicPage) {
    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    return response
  }

  // Se não é página pública e não está logado → redirecionar para login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|privacy|terms).*)"],
}

