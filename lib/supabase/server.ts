import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/databas.types'

/**
 * Klient på servern, med användarens session ur kakorna. Går genom RLS.
 * Det är den här som ska användas överallt utom där tjänstenyckeln krävs.
 */
export async function serverklient() {
  const kakor = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return kakor.getAll()
        },
        setAll(nya) {
          try {
            for (const { name, value, options } of nya) kakor.set(name, value, options)
          } catch {
            // Anropat från en server component. Middleware förnyar sessionen i stället.
          }
        },
      },
    },
  )
}

/**
 * Tjänsteklient. **Kringgår RLS.** Får bara användas i server actions och
 * route handlers, och aldrig skickas till klienten. Importen av 'server-only'
 * högst upp gör att bygget faller om filen råkar dras in i en klientbunt.
 */
export function tjansteklient() {
  const nyckel = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!nyckel) throw new Error('SUPABASE_SERVICE_ROLE_KEY saknas')
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, nyckel, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
