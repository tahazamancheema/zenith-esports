import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This endpoint bootstraps the first admin user.
// Visit: http://localhost:3000/api/bootstrap-admin
// It takes the currently logged-in user and ensures they have a profile with role='admin'.
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated. Please sign in first, then visit this URL.' },
                { status: 401 }
            )
        }

        // Try to insert the user profile — if it already exists, update the role to admin
        const { data: profile, error: upsertError } = await supabase
            .from('users')
            .upsert(
                {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
                    role: 'admin',
                },
                { onConflict: 'id' }
            )
            .select()
            .single()

        if (upsertError) {
            // If upsert fails due to RLS, try a direct insert then update approach
            // First try insert
            await supabase.from('users').insert({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                role: 'admin',
            })

            // Then try update
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', user.id)

            if (updateError) {
                return NextResponse.json({
                    success: false,
                    error: 'Could not create/update profile. RLS policies may be blocking.',
                    upsert_error: upsertError.message,
                    update_error: updateError.message,
                    fix: 'Run this SQL in Supabase SQL Editor: INSERT INTO public.users (id, email, role) SELECT id, email, \'admin\' FROM auth.users WHERE email = \'' + user.email + '\' ON CONFLICT (id) DO UPDATE SET role = \'admin\';',
                    user_id: user.id,
                    user_email: user.email,
                })
            }

            return NextResponse.json({
                success: true,
                message: 'Admin profile created via insert+update!',
                user_id: user.id,
                email: user.email,
                role: 'admin',
            })
        }

        return NextResponse.json({
            success: true,
            message: 'You are now an admin! Go to /admin to access the admin panel.',
            profile,
        })
    } catch (err) {
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
