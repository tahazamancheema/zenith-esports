'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
    const [session, setSession] = useState<any>(null)
    const [dbUser, setDbUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const supabase = createClient()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        setLoading(true)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            setSession(session)

            if (sessionError) throw sessionError

            if (session?.user) {
                const { data: user, error: dbError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                setDbUser(user)
                if (dbError) console.error('DB Error:', dbError)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-10 max-w-4xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-6">Auth Debugger</h1>

            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="grid grid-cols-2 gap-8">
                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="font-bold mb-2">Auth Session (Supabase Auth)</h2>
                    <pre className="text-xs overflow-auto max-h-[500px]">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="font-bold mb-2">Database Profile (public.users)</h2>
                    <pre className="text-xs overflow-auto max-h-[500px]">
                        {JSON.stringify(dbUser, null, 2)}
                    </pre>
                    {!dbUser && session && (
                        <div className="mt-4 text-yellow-400">
                            Warning: User exists in Auth but not in public.users table!
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={checkAuth}
                className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
                Refresh Data
            </button>
        </div>
    )
}
