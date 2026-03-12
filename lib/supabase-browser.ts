"use client"

import { createBrowserClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

export function supabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
