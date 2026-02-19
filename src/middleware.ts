import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isLoginPage = request.nextUrl.pathname === '/login'

    if (!user && (isAdminRoute || isDashboardRoute)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from login page
    if (user && isLoginPage) {
        const redirect = request.nextUrl.searchParams.get('redirect') || '/'
        const url = request.nextUrl.clone()
        url.pathname = redirect
        url.search = ''
        return NextResponse.redirect(url)
    }

    // Admin route role check
    if (user && isAdminRoute) {
        let { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        // If no profile exists, try to create one
        if (!profile) {
            const { data: newProfile } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
                    role: 'user',
                }, { onConflict: 'id' })
                .select('role')
                .single()
            profile = newProfile
        }

        if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Moderator restrictions
        if (profile.role === 'moderator') {
            const restrictedPaths = ['/admin/users', '/admin/tournaments/new']
            const isEditRoute = /\/admin\/tournaments\/[^/]+\/edit/.test(request.nextUrl.pathname)
            if (restrictedPaths.some(p => request.nextUrl.pathname.startsWith(p)) || isEditRoute) {
                const url = request.nextUrl.clone()
                url.pathname = '/admin'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
