import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthRoute = req.nextUrl.pathname.startsWith("/login")

  if (!session && !isAuthRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
