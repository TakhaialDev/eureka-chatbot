import { NextResponse, NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  // We no longer redirect to login. 
  // Authentication is initialized in the background if needed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)',
  ],
};