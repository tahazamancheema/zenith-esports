import { Trophy, Users, FileText, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
    let stats = { tournaments: 0, pendingRegs: 0, totalRegs: 0, users: 0 }

    try {
        const supabase = await createClient()
        const [tournamentsRes, pendingRes, totalRegsRes, usersRes] = await Promise.all([
            supabase.from('tournaments').select('id', { count: 'exact', head: true }),
            supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('registrations').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }),
        ])
        stats = {
            tournaments: tournamentsRes.count || 0,
            pendingRegs: pendingRes.count || 0,
            totalRegs: totalRegsRes.count || 0,
            users: usersRes.count || 0,
        }
    } catch {
        // Supabase not configured
    }

    return (
        <div className="p-6 md:p-8">
            <h1 className="font-heading text-2xl font-bold mb-6">Dashboard <span className="text-gold">Overview</span></h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { icon: Trophy, label: 'Tournaments', value: stats.tournaments, color: 'text-gold', bg: 'bg-gold/10' },
                    { icon: AlertCircle, label: 'Pending Reviews', value: stats.pendingRegs, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    { icon: FileText, label: 'Total Registrations', value: stats.totalRegs, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { icon: Users, label: 'Users', value: stats.users, color: 'text-green-400', bg: 'bg-green-400/10' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-5">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <div className="font-heading text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-text-muted">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/tournaments" className="glass-card p-6 hover:border-gold/30 transition-colors group">
                    <Trophy size={24} className="text-gold mb-3" />
                    <h3 className="font-heading font-bold text-lg group-hover:text-gold transition-colors">Manage Tournaments</h3>
                    <p className="text-sm text-text-muted mt-1">Create, edit, and manage tournaments</p>
                </Link>
                <Link href="/admin/tournaments" className="glass-card p-6 hover:border-gold/30 transition-colors group">
                    <AlertCircle size={24} className="text-amber-400 mb-3" />
                    <h3 className="font-heading font-bold text-lg group-hover:text-gold transition-colors">Review Registrations</h3>
                    <p className="text-sm text-text-muted mt-1">{stats.pendingRegs} pending team registrations to review</p>
                </Link>
            </div>
        </div>
    )
}
