import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Trophy, Edit, Eye, Users, ClipboardList, FileDown } from 'lucide-react'
import { formatDatePKT } from '@/lib/utils'
import type { Tournament } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminTournamentsPage() {
    let tournaments: Tournament[] = []

    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('tournaments')
            .select('*')
            .order('created_at', { ascending: false })
        tournaments = (data || []) as Tournament[]
    } catch {
        // not configured
    }

    return (
        <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-heading text-2xl font-bold">Manage <span className="text-gold">Tournaments</span></h1>
                <Link href="/admin/tournaments/new" className="btn-gold text-xs flex items-center gap-1">
                    <Plus size={14} /> Create
                </Link>
            </div>

            {tournaments.length > 0 ? (
                <div className="space-y-4">
                    {tournaments.map((t) => (
                        <div key={t.id} className="glass-card p-5">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {t.poster_url ? (
                                        <img src={t.poster_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-16 h-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                            <Trophy size={20} className="text-gold" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-heading font-bold text-base truncate">{t.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-text-muted">
                                            <span>{t.server_region}</span>
                                            <span>•</span>
                                            <span>{t.total_team_capacity} teams</span>
                                            <span>•</span>
                                            <span className={t.is_published ? 'text-green-400' : 'text-amber-400'}>
                                                {t.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Link href={`/tournaments/${t.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs hover:text-text-primary transition-colors">
                                        <Eye size={12} /> View
                                    </Link>
                                    <Link href={`/admin/tournaments/${t.id}/edit`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs hover:text-text-primary transition-colors">
                                        <Edit size={12} /> Edit
                                    </Link>
                                    <Link href={`/admin/tournaments/${t.id}/registrations`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs hover:text-text-primary transition-colors">
                                        <ClipboardList size={12} /> Registrations
                                    </Link>

                                    <Link href={`/admin/tournaments/${t.id}/form-builder`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs hover:text-text-primary transition-colors">
                                        <Users size={12} /> Form
                                    </Link>
                                    <Link href={`/admin/tournaments/${t.id}/export`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs hover:text-text-primary transition-colors">
                                        <FileDown size={12} /> Export
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Trophy size={48} className="text-gold/20 mx-auto mb-4" />
                    <h3 className="font-heading text-xl font-bold text-text-secondary mb-2">No Tournaments</h3>
                    <p className="text-text-muted text-sm mb-6">Create your first tournament to get started</p>
                    <Link href="/admin/tournaments/new" className="btn-gold">Create Tournament</Link>
                </div>
            )}
        </div>
    )
}
