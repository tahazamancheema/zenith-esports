'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
    const [logs, setLogs] = useState<string[]>([])
    const supabase = createClient()

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`])

    const testAuth = async () => {
        setLogs([])
        addLog('Starting Auth Test...')
        addLog(`URL Configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`)
        addLog(`Key Configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)


        try {
            addLog('Calling getUser()...')
            const { data: userData, error: userError } = await supabase.auth.getUser()
            addLog(`getUser() result: ${userError ? 'Error' : 'Success'}, User: ${userData?.user?.email || 'None'}`)
            if (userError) addLog(`getUser() Error: ${userError.message}`)

            addLog('Calling getSession()...')
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            addLog(`getSession() result: ${sessionError ? 'Error' : 'Success'}, Session: ${sessionData?.session ? 'Active' : 'None'}`)
            if (sessionError) addLog(`getSession() Error: ${sessionError.message}`)

        } catch (err: any) {
            addLog(`EXCEPTION: ${err.message}`)
        }
        addLog('Test Complete')
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Auth Debugger</h1>
            <button onClick={testAuth} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4">
                Run Auth Test
            </button>
            <div className="bg-gray-900 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
                {logs.length === 0 ? <span className="text-gray-500">Ready to test...</span> : logs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>
                ))}
            </div>
        </div>
    )
}
