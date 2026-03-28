import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!req.auth;
  const isAuthPage = pathname.startsWith("/login");
  const isSetupPage = pathname.startsWith("/setup");
  const isApiAuth = pathname.startsWith("/api/auth");

  // Allow public API routes and auth pages
  if (isApiAuth || isSetupPage) return NextResponse.next();

  // Redirect unauthenticated users to /login
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already authenticated users away from /login
  // EXCEPT if an error param is present (e.g. ?error=session = user not found in DB)
  if (isLoggedIn && isAuthPage) {
    const hasErrorParam = req.nextUrl.searchParams.has("error");
    if (hasErrorParam) return NextResponse.next(); // let the page handle it
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static (static files)
     * - _next/image (Next.js image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
