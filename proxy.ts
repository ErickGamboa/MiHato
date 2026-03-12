import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
const allowedPrefix = "mihato"

export default async function proxy(req: NextRequest) {
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
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = req.nextUrl.pathname.startsWith("/login")
  const email = user?.email ?? ""
  const isAllowedEmail = email.toLowerCase().startsWith(allowedPrefix)

  if (!user || !isAllowedEmail) {
    if (!isAuthRoute) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search)
      if (email && !isAllowedEmail) redirectUrl.searchParams.set("error", "no-autorizado")
      return NextResponse.redirect(redirectUrl)
    }

    if (user && !isAllowedEmail) {
      await supabase.auth.signOut()
    }

    return res
  }

  if (user && isAllowedEmail && isAuthRoute) {
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
