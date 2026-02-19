'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Loader2, Save } from 'lucide-react'
import type { User } from '@/lib/types'

export default function UsersPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        checkSession().then(loadUsers)
    }, [])

    const checkSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
            // Optional: redirect to login if strictly required, 
            // but for now just ensure we don't try to fetch data with a dead session if we can avoid it.
            return false
        }
        return true
    }

    const loadUsers = async () => {
        try {
            // 10s timeout
            const query = supabase.from('users').select('*').order('created_at', { ascending: false })

            // Race the query against a timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 10000))
            const { data, error } = await Promise.race([query, timeoutPromise]) as any

            if (error) throw error
            setUsers((data || []) as User[])
        } catch (err) {
            console.error('Failed to load users:', err)
            // don't set loading to false yet? or set error state?
        } finally {
            setLoading(false)
        }
    }

    const updateRole = async (userId: string, newRole: string) => {
        setUpdating(userId)
        try {
            // Auth check fallback
            const { data: { session } } = await supabase.auth.getSession()
            let user = session?.user

            if (!user) {
                const { data: { user: u } } = await supabase.auth.getUser()
                user = u || undefined
            }

            if (!user) {
                alert('Session expired. Please sign in again.')
                return
            }

            const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
            if (error) throw error

            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'change_role',
                entity_type: 'user',
                entity_id: userId,
                details: { new_role: newRole },
            })

            loadUsers()
        } catch (err) {
            console.error(err)
            alert('Failed to update role')
        } finally {
            setUpdating(null)
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-gold animate-spin" /></div>

    return (
        <div className="p-6 md:p-8">
            <h1 className="font-heading text-2xl font-bold mb-6">Manage <span className="text-gold">Users</span></h1>

            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-sm font-bold shrink-0">
                                {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium text-sm truncate">{user.full_name || 'No Name'}</div>
                                <div className="text-xs text-text-muted truncate">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={user.role}
                                onChange={(e) => updateRole(user.id, e.target.value)}
                                disabled={updating === user.id}
                                className="input-field text-sm w-36"
                            >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                            </select>
                            {updating === user.id && <Loader2 size={14} className="text-gold animate-spin" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
