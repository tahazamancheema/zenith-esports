'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDatePKT, getStatusColor } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, Users, Loader2 } from 'lucide-react'
import type { Registration, Tournament } from '@/lib/types'

export default function DashboardPage() {
    const router = useRouter()
    const [registrations, setRegistrations] = useState<(Registration & { tournament: Tournament })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const supabase = createClient()

    useEffect(() => {
        loadRegistrations()
    }, [])

    const loadRegistrations = async () => {
        setLoading(true)
        setError('')
        try {
            // Auth check
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                console.warn('Dashboard: User not authenticated', authError)
                setLoading(false) // Stop loading before redirect
                router.replace('/login?redirect=/dashboard')
                return
            }

            // Data fetch with optimized select
            const { data, error: dbError } = await supabase
                .from('registrations')
                .select('*, tournament:tournaments(id, name, game, poster_url, status, match_start)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (dbError) {
                console.error('Dashboard DB Error:', dbError)
                // RLS Error code: 42501
                if (dbError.code === '42501') {
                    throw new Error('Permission denied. Please try signing out and back in.')
                }
                throw dbError
            }

            setRegistrations((data || []) as (Registration & { tournament: Tournament })[])
        } catch (err: any) {
            console.error('Dashboard load error:', err)
            setError(err.message || 'Failed to load dashboard. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="text-gold animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    <p className="font-bold mb-1">Error Loading Dashboard</p>
                    <p className="text-sm">{error}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadRegistrations} className="btn-gold">Retry</button>
                    <button onClick={() => window.location.href = '/'} className="btn-outline">Go Home</button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">My <span className="text-gold">Dashboard</span></h1>
            <p className="text-text-muted text-sm mb-8">Track your tournament registrations and team status</p>

            {registrations.length > 0 ? (
                <div className="space-y-4">
                    {registrations.map((reg) => (
                        <div key={reg.id} className="glass-card p-5 hover:border-gold/20 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {reg.team_logo_url ? (
                                        <img src={reg.team_logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                                            <Users size={20} className="text-gold" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-heading font-bold text-base truncate">{reg.team_name}</h3>
                                        <Link href={`/tournaments/${reg.tournament_id}`} className="text-sm text-text-muted hover:text-gold transition-colors truncate block">
                                            {reg.tournament?.name}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`badge ${getStatusColor(reg.status)}`}>
                                        {reg.status.replace('_', ' ')}
                                    </span>
                                    <div className="text-xs text-text-muted flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDatePKT(reg.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Trophy size={48} className="text-gold/20 mx-auto mb-4" />
                    <h3 className="font-heading text-xl font-bold text-text-secondary mb-2">No Registrations</h3>
                    <p className="text-text-muted text-sm mb-6">You haven&apos;t registered for any tournaments yet.</p>
                    <Link href="/tournaments" className="btn-gold">Browse Tournaments</Link>
                </div>
            )}
        </div>
    )
}
