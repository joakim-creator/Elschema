import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const OPPNA = ['/logga-in', '/_next', '/favicon.ico']

/**
 * Next 16 kallar det proxy, inte middleware. Filnamnet middleware.ts fungerar
 * än men varnar vid bygget.
 *
 * Förnyar sessionen vid varje anrop och stänger allt utom inloggningssidan.
 * Sluten grupp (spec avsnitt 4, J4): finns ingen session finns inget att visa.
 */
export async function proxy(request: NextRequest) {
  let svar = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(nya) {
          for (const { name, value } of nya) request.cookies.set(name, value)
          svar = NextResponse.next({ request })
          for (const { name, value, options } of nya)
            svar.cookies.set(name, value, options)
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sokvag = request.nextUrl.pathname
  if (!user && !OPPNA.some((p) => sokvag.startsWith(p))) {
    const till = request.nextUrl.clone()
    till.pathname = '/logga-in'
    return NextResponse.redirect(till)
  }

  return svar
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
