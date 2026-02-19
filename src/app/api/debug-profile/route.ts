import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated', authError: authError?.message }, { status: 401 })
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            auth_user_id: user.id,
            auth_email: user.email,
            profile_exists: !!profile,
            profile,
            profile_error: profileError?.message,
        })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
