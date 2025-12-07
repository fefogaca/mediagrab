import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // ROTAS PÚBLICAS - Sempre permitir acesso
  // ============================================
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/pricing",
    "/docs",
    "/contact",
    "/privacy",
    "/terms",
    "/payment", // Rotas de pagamento podem ser públicas inicialmente
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // ============================================
  // ROTAS DE API PÚBLICAS
  // ============================================
  const publicApiRoutes = [
    "/api/auth", // NextAuth e autenticação customizada
    "/api/setup", // Setup inicial do sistema
    "/api/public-download", // Download público
    "/api/generate-free-api-key", // Geração de API key gratuita
    "/api/webhooks", // Webhooks de pagamento
  ];

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Permitir todas as rotas de API públicas
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Permitir rotas públicas de páginas
  if (isPublicRoute && !pathname.startsWith("/api/")) {
    // Se já autenticado e tentando acessar login/register, redirecionar
    if (pathname === "/login" || pathname === "/register") {
      const hasNextAuthToken =
        request.cookies.get("next-auth.session-token")?.value ||
        request.cookies.get("__Secure-next-auth.session-token")?.value ||
        request.cookies.get("authjs.session-token")?.value ||
        request.cookies.get("__Secure-authjs.session-token")?.value;

      const hasCustomToken = request.cookies.get("token")?.value;

      if (hasNextAuthToken || hasCustomToken) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // ============================================
  // VERIFICAÇÃO DE AUTENTICAÇÃO
  // ============================================
  // Verificar tokens do NextAuth v4 (múltiplos formatos possíveis)
  const hasNextAuthToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Verificar token JWT customizado
  const hasCustomToken = request.cookies.get("token")?.value;

  const isAuthenticated = !!hasNextAuthToken || !!hasCustomToken;

  // ============================================
  // ROTAS PROTEGIDAS
  // ============================================
  const protectedRoutes = ["/dashboard", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ============================================
  // ROTAS DE API PROTEGIDAS
  // ============================================
  // Rotas de API que não são públicas são protegidas
  // Cada rota de API tem sua própria lógica de autenticação
  // O middleware apenas permite que passem, a proteção é feita na rota
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Permitir todas as outras rotas
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - public (public files)
     * - arquivos estáticos (png, jpg, jpeg, gif, svg, ico, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$).*)",
  ],
};
