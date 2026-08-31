import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/databas.types'

/** Klient i webbläsaren. Ser bara det RLS släpper igenom för den inloggade. */
export function webblasarklient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
