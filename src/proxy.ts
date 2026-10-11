import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Next 16: "middleware" pasó a llamarse "proxy" (runtime Node.js).
// Comprobación optimista con el JWT: redirige sin sesión y saca a quien no es
// admin de /dashboard/users. Las páginas y acciones vuelven a validar contra la
// base de datos (ver src/lib/session.ts).
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname, search } = request.nextUrl;

  if (!token) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/dashboard/users") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
