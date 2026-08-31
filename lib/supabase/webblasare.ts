import { createBrowserClient } from '@supabase/ssr'

/** Klient i webbläsaren. Ser bara det RLS släpper igenom för den inloggade. */
export function webblasarklient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
