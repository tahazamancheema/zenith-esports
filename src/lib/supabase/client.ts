import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-auth-token',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        domain: '',
        path: '/',
        sameSite: 'lax',
      },
      auth: {
        // Disable the aggressive lock which causes timeouts
        lock: {
          // @ts-ignore
          enabled: false,
          acquire: () => Promise.resolve(null),
          release: () => Promise.resolve(),
        } as any,
      }
    }
  )
}
