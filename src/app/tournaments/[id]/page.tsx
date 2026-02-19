import { Trophy, Users, Shield, Calendar, MapPin, Clock, ChevronRight, Search, Medal, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDatePKT, isTournamentLive, isRegistrationOpen, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import type { Tournament, TournamentStage, TournamentSchedule, Registration, Slot } from '@/lib/types'
import SlotList from '@/components/tournaments/SlotList'

export const dynamic = 'force-dynamic'

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    let tournament: (Tournament & { mvp_prize?: string }) | null = null
    let stages: TournamentStage[] = []
    let schedule: TournamentSchedule[] = []
    let approvedTeams: Registration[] = []
    let slots: (Slot & { registration: Registration | null })[] = []
    let prizeDistribution: { place: string; prize: string }[] = []
    let userRegistration: Registration | null = null
    let userTeamId: string | null = null

    try {
        const { data: t } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single()
        tournament = t as (Tournament & { mvp_prize?: string }) | null

        if (tournament) {
            const [stagesRes, scheduleRes, teamsRes, slotsRes, prizeRes] = await Promise.all([
                supabase.from('tournament_stages').select('*').eq('tournament_id', id).order('sort_order'),
                supabase.from('tournament_schedule').select('*').eq('tournament_id', id).order('match_date'),
                supabase.from('registrations').select('*').eq('tournament_id', id).in('status', ['approved', 'assigned_slot']),
                supabase.from('slots').select('*, registration:registrations(id, team_name, team_logo_url)').eq('tournament_id', id).order('slot_number'),
                supabase.from('tournament_prizepool_distribution').select('*').eq('tournament_id', id).order('sort_order'),
            ])
            stages = (stagesRes.data || []) as TournamentStage[]
            schedule = (scheduleRes.data || []) as TournamentSchedule[]
            approvedTeams = (teamsRes.data || []) as Registration[]
            slots = (slotsRes.data || []) as (Slot & { registration: Registration | null })[]
            prizeDistribution = (prizeRes.data || []) as { place: string; prize: string }[]

            // Check user status
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                const { data: reg } = await supabase.from('registrations').select('*').eq('tournament_id', id).eq('user_id', session.user.id).neq('status', 'rejected').maybeSingle()
                if (reg) {
                    userRegistration = reg as Registration
                    // Find actual approved team logic if strictly enforcing approval for highlighting, 
                    // but usually we highlight their slot if they have one.
                    // If they are 'assigned_slot' or 'approved', they might be in the slots list.
                    // The slot list has 'registration_id'.
                    userTeamId = reg.id
                }
            }
        }
    } catch {
        // Supabase not configured
    }

    if (!tournament) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <Trophy size={48} className="text-gold/20 mx-auto mb-4" />
                <h1 className="font-heading text-2xl font-bold mb-2">Tournament Not Found</h1>
                <p className="text-text-muted mb-6">This tournament may have been removed or doesn&apos;t exist.</p>
                <Link href="/tournaments" className="btn-gold">Browse Tournaments</Link>
            </div>
        )
    }

    const isLive = isTournamentLive(tournament.match_start, tournament.match_end)
    const regOpen = isRegistrationOpen(tournament.registration_start, tournament.registration_end)

    return (
        <div className="w-full">
            {/* Hero Banner */}
            <div className="relative">
                <div className="aspect-[3/1] md:aspect-[4/1] bg-bg-tertiary overflow-hidden">
                    {tournament.poster_url ? (
                        <img src={tournament.poster_url} alt={tournament.name} className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-bg-tertiary to-bg-card" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                        <div className="flex items-end gap-4">
                            {tournament.logo_url && (
                                <img src={tournament.logo_url} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-border-primary object-cover" />
                            )}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {isLive && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/90 text-white text-xs font-bold uppercase">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                                        </span>
                                    )}
                                    {regOpen && !userRegistration && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase border border-green-500/30">
                                            Registration Open
                                        </span>
                                    )}
                                    {userRegistration && (
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(userRegistration.status)}`}>
                                            {userRegistration.status.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                                <h1 className="font-heading text-2xl md:text-4xl font-bold">{tournament.name}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Info Cards - Highlighted Prize Pool */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: Trophy, label: 'Prize Pool', value: tournament.prize_pool || 'TBA', highlighted: true },
                        { icon: MapPin, label: 'Server', value: tournament.server_region },
                        { icon: Users, label: 'Capacity', value: `${approvedTeams.length}/${tournament.total_team_capacity}` },
                        { icon: Shield, label: 'Game', value: 'PUBG Mobile' },
                    ].map((info, i) => (
                        <div key={i} className={`glass-card p-4 text-center ${info.highlighted ? 'border-gold/50 bg-gold/5 shadow-[0_0_15px_-3px_rgba(255,215,0,0.1)]' : ''}`}>
                            <info.icon size={18} className={`${info.highlighted ? 'text-gold fill-gold/10' : 'text-gold'} mx-auto mb-1.5`} />
                            <div className={`font-heading text-lg font-bold ${info.highlighted ? 'text-gold' : ''}`}>{info.value}</div>
                            <div className="text-xs text-text-muted">{info.label}</div>
                        </div>
                    ))}
                </div>

                {/* Registration CTA - Logic Update */}
                {regOpen && !userRegistration && (
                    <div className="mb-8">
                        <Link href={`/tournaments/${tournament.id}/register`} className="btn-gold w-full md:w-auto px-8 py-3 text-base flex items-center justify-center gap-2">
                            <Trophy size={18} />
                            Register Now
                            <span className="text-xs opacity-70 font-normal ml-1">(Closes {formatDatePKT(tournament.registration_end)})</span>
                        </Link>
                    </div>
                )}
                {userRegistration && (
                    <div className="mb-8 p-4 rounded-lg bg-bg-secondary border border-border-primary flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Registered as {userRegistration.team_name}</div>
                                <div className="text-xs text-text-muted">Status: <span className="capitalize">{userRegistration.status.replace('_', ' ')}</span></div>
                            </div>
                        </div>
                        <Link href="/dashboard" className="text-sm text-gold hover:underline">Manage Team</Link>
                    </div>
                )}

                {/* Description */}
                {tournament.description && (
                    <div className="glass-card p-6 mb-8">
                        <h2 className="font-heading text-lg font-bold text-gold mb-3">About</h2>
                        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{tournament.description}</p>
                    </div>
                )}

                {/* Prize Pool & MVP Section */}
                {(tournament.mvp_prize || prizeDistribution.length > 0) && (
                    <div className="glass-card p-6 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-2 mb-6">
                            <Trophy className="text-gold" size={24} />
                            <h2 className="font-heading text-xl font-bold text-gold">Prize Breakdown</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Distribution Table */}
                            {prizeDistribution.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                        <Medal size={16} className="text-text-muted" /> Placement Prizes
                                    </h3>
                                    <div className="space-y-2">
                                        {prizeDistribution.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary border border-border-primary/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                        ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                            i === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                                i === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-bg-tertiary text-text-muted'}`}>
                                                        {item.place}
                                                    </div>
                                                </div>
                                                <div className="font-heading font-bold text-gold">{item.prize}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* MVP Prize */}
                            {tournament.mvp_prize && (
                                <div>
                                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                        <Star size={16} className="text-text-muted" /> MVP Prize
                                    </h3>
                                    <div className="p-6 rounded-xl bg-gradient-to-br from-gold/20 to-bg-secondary border border-gold/30 text-center flex flex-col items-center justify-center h-[140px]">
                                        <Star size={32} className="text-gold mb-2 fill-gold animate-pulse" />
                                        <div className="font-heading text-2xl font-bold text-white mb-1">{tournament.mvp_prize}</div>
                                        <div className="text-xs text-gold/80 uppercase tracking-widest font-bold">Most Valuable Player</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Dates - Highlighted Registration Closing */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Schedule</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tournament.registration_start && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                                <Calendar size={16} className="text-gold mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-xs text-text-muted uppercase">Registration Opens</div>
                                    <div className="text-sm text-text-primary">{formatDatePKT(tournament.registration_start)}</div>
                                </div>
                            </div>
                        )}
                        {tournament.registration_end && (
                            <div className={`flex items-start gap-3 p-3 rounded-lg bg-bg-secondary ${regOpen ? 'border border-red-500/30 bg-red-500/5' : ''}`}>
                                <Calendar size={16} className="text-accent-red mt-0.5 shrink-0" />
                                <div>
                                    <div className={`text-xs uppercase ${regOpen ? 'text-red-400 font-bold' : 'text-text-muted'}`}>Registration Closes</div>
                                    <div className="text-sm text-text-primary">{formatDatePKT(tournament.registration_end)}</div>
                                </div>
                            </div>
                        )}
                        {tournament.match_start && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                                <Clock size={16} className="text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-xs text-text-muted uppercase">Matches Start</div>
                                    <div className="text-sm text-text-primary">{formatDatePKT(tournament.match_start)}</div>
                                </div>
                            </div>
                        )}
                        {tournament.match_end && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                                <Clock size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-xs text-text-muted uppercase">Matches End</div>
                                    <div className="text-sm text-text-primary">{formatDatePKT(tournament.match_end)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Roadmap Timeline */}
                {stages.length > 0 && (
                    <div className="glass-card p-6 mb-8">
                        <h2 className="font-heading text-lg font-bold text-gold mb-6">Tournament Roadmap</h2>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-primary md:left-1/2 md:-translate-x-0.5" />
                            <div className="space-y-8">
                                {stages.map((stage, i) => (
                                    <div key={stage.id} className={`relative flex items-start gap-4 md:gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                        <div className={`hidden md:block md:w-1/2 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                                            <div className="glass-card p-4 inline-block">
                                                <h3 className="font-heading text-base font-bold text-gold">{stage.name}</h3>
                                                {stage.description && <p className="text-xs text-text-muted mt-1">{stage.description}</p>}
                                                {stage.start_date && (
                                                    <p className="text-xs text-text-secondary mt-2">{formatDatePKT(stage.start_date)}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-gold rounded-full border-2 border-bg-primary -translate-x-1.5 mt-1.5 z-10" />
                                        <div className="ml-10 md:hidden glass-card p-4">
                                            <h3 className="font-heading text-base font-bold text-gold">{stage.name}</h3>
                                            {stage.description && <p className="text-xs text-text-muted mt-1">{stage.description}</p>}
                                            {stage.start_date && (
                                                <p className="text-xs text-text-secondary mt-2">{formatDatePKT(stage.start_date)}</p>
                                            )}
                                        </div>
                                        <div className="hidden md:block md:w-1/2" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Match Schedule */}
                {schedule.length > 0 && (
                    <div className="glass-card p-6 mb-8">
                        <h2 className="font-heading text-lg font-bold text-gold mb-4">Match Schedule</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-primary">
                                        <th className="text-left py-3 px-4 text-xs text-text-muted uppercase">Date & Time</th>
                                        <th className="text-left py-3 px-4 text-xs text-text-muted uppercase">Match</th>
                                        <th className="text-left py-3 px-4 text-xs text-text-muted uppercase hidden sm:table-cell">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.map((entry) => (
                                        <tr key={entry.id} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                                            <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{formatDatePKT(entry.match_date)}</td>
                                            <td className="py-3 px-4 font-medium">{entry.title}</td>
                                            <td className="py-3 px-4 text-text-muted hidden sm:table-cell">{entry.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Verified Teams */}
                <div className="glass-card p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gold">Verified Teams ({approvedTeams.length})</h2>
                    </div>
                    {approvedTeams.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {approvedTeams.map((team) => (
                                <div key={team.id} className={`flex items-center gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors ${userTeamId === team.id ? 'border border-gold/50 bg-gold/5' : ''}`}>
                                    {team.team_logo_url ? (
                                        <img src={team.team_logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                            <Users size={14} className="text-gold" />
                                        </div>
                                    )}
                                    <span className={`text-sm font-medium truncate ${userTeamId === team.id ? 'text-gold' : ''}`}>{team.team_name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-muted text-sm text-center py-6">No verified teams yet</p>
                    )}
                </div>

            </div>
        </div>
    )
}
