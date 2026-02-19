import { Trophy, Shield, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDatePKT, isTournamentLive, isRegistrationOpen } from '@/lib/utils'
import type { Tournament } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
    let tournaments: Tournament[] = []

    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('tournaments')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
        tournaments = (data || []) as Tournament[]
    } catch {
        // Supabase not configured yet
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="mb-10">
                <h1 className="font-heading text-3xl md:text-4xl font-bold">
                    <span className="text-gold">PUBG Mobile</span> Tournaments
                </h1>
                <p className="text-text-muted mt-2">Browse and register for upcoming tournaments</p>
            </div>

            {tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((tournament) => {
                        const isLive = isTournamentLive(tournament.match_start, tournament.match_end)
                        const regOpen = isRegistrationOpen(tournament.registration_start, tournament.registration_end)
                        return (
                            <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group">
                                <div className="glass-card overflow-hidden hover:border-gold/30 transition-all duration-300 group-hover:translate-y-[-2px]">
                                    <div className="relative aspect-video bg-bg-tertiary">
                                        {tournament.poster_url ? (
                                            <img src={tournament.poster_url} alt={tournament.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Trophy size={40} className="text-gold/20" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            {isLive && (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-xs font-bold uppercase">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                                                </span>
                                            )}
                                            {regOpen && (
                                                <span className="px-2.5 py-1 rounded-full bg-green-500/90 text-white text-xs font-bold uppercase">
                                                    Open
                                                </span>
                                            )}
                                        </div>
                                        {tournament.prize_pool && (
                                            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-gold text-xs font-bold">
                                                {tournament.prize_pool}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-heading text-lg font-bold group-hover:text-gold transition-colors">
                                            {tournament.name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                            <span className="flex items-center gap-1">
                                                <Shield size={12} className="text-gold/60" /> {tournament.server_region}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={12} className="text-gold/60" /> {tournament.total_team_capacity} Teams
                                            </span>
                                        </div>
                                        {tournament.registration_end && (
                                            <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border-primary">
                                                Reg. closes: <span className="text-text-secondary">{formatDatePKT(tournament.registration_end)}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Trophy size={48} className="text-gold/20 mx-auto mb-4" />
                    <h3 className="font-heading text-xl font-bold text-text-secondary mb-2">No Tournaments Yet</h3>
                    <p className="text-text-muted text-sm">Check back soon for new tournament announcements!</p>
                </div>
            )}
        </div>
    )
}
