'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Tournament, TournamentStage, TournamentSchedule } from '@/lib/types'

export default function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        name: '', description: '', prize_pool: '', server_region: 'Asia',
        total_team_capacity: 20, max_players_per_team: 5, teams_per_group: 0,
        is_paid: false, is_published: false,
        registration_start: '', registration_end: '', match_start: '', match_end: '',
        mvp_prize: '',
    })
    const [stages, setStages] = useState<{ id?: string; name: string; description: string; start_date: string }[]>([])
    const [scheduleEntries, setScheduleEntries] = useState<{ id?: string; title: string; description: string; match_date: string }[]>([])
    const [prizeDistribution, setPrizeDistribution] = useState<{ id?: string; place: string; prize: string }[]>([])

    useEffect(() => { loadTournament() }, [id])

    const toLocalDatetime = (isoStr: string | null) => {
        if (!isoStr) return ''
        const d = new Date(isoStr)
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - offset * 60000)
        return local.toISOString().slice(0, 16)
    }

    const loadTournament = async () => {
        // Create a promise that rejects after 5 seconds to detect RLS hangs
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Database request timed out. This usually means "fix-rls.sql" was not run.')), 15000))

        try {
            const fetchData = async () => {
                const { data: t, error: tError } = await supabase.from('tournaments').select('*').eq('id', id).single()
                if (tError) throw tError

                if (t) {
                    const tournament = t as Tournament & { mvp_prize?: string }
                    setForm({
                        name: tournament.name, description: tournament.description || '',
                        prize_pool: tournament.prize_pool || '', server_region: tournament.server_region,
                        total_team_capacity: tournament.total_team_capacity,
                        max_players_per_team: tournament.max_players_per_team,
                        teams_per_group: tournament.teams_per_group,
                        is_paid: tournament.is_paid, is_published: tournament.is_published,
                        registration_start: toLocalDatetime(tournament.registration_start),
                        registration_end: toLocalDatetime(tournament.registration_end),
                        match_start: toLocalDatetime(tournament.match_start),
                        match_end: toLocalDatetime(tournament.match_end),
                        mvp_prize: tournament.mvp_prize || '',
                    })
                }
                const { data: stagesData } = await supabase.from('tournament_stages').select('*').eq('tournament_id', id).order('sort_order')
                setStages((stagesData || []).map((s: TournamentStage) => ({ id: s.id, name: s.name, description: s.description || '', start_date: toLocalDatetime(s.start_date) })))

                const { data: scheduleData } = await supabase.from('tournament_schedule').select('*').eq('tournament_id', id).order('sort_order')
                setScheduleEntries((scheduleData || []).map((s: TournamentSchedule) => ({ id: s.id, title: s.title, description: s.description || '', match_date: toLocalDatetime(s.match_date) })))

                const { data: prizeData } = await supabase.from('tournament_prizepool_distribution').select('*').eq('tournament_id', id).order('sort_order')
                setPrizeDistribution((prizeData || []).map((p: any) => ({ id: p.id, place: p.place, prize: p.prize })))
            }

            // Race the fetch against the timeout
            await Promise.race([fetchData(), timeout])

        } catch (err: any) {
            console.error('Load Error:', err)
            setError(err.message || 'Failed to load tournament')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        // Helper to convert local datetime-local string to ISO UTC
        const toISO = (dateStr: string) => dateStr ? new Date(dateStr).toISOString() : null

        try {
            // Try to get session from local storage first
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            let user = session?.user

            if (!user) {
                const { data: { user: u }, error: authError } = await supabase.auth.getUser()
                user = u || undefined
                if (authError || !user) {
                    setError('Session expired. Please sign in again.')
                    setSaving(false)
                    return
                }
            }

            const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
            if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
                setError('Unauthorized')
                setSaving(false)
                return
            }

            const { error: updateError } = await supabase.from('tournaments').update({
                ...form,
                registration_start: toISO(form.registration_start),
                registration_end: toISO(form.registration_end),
                match_start: toISO(form.match_start),
                match_end: toISO(form.match_end),
                updated_at: new Date().toISOString(),
            }).eq('id', id)
            if (updateError) throw updateError

            // Update stages: delete all and re-insert
            await supabase.from('tournament_stages').delete().eq('tournament_id', id)
            if (stages.length > 0) {
                await supabase.from('tournament_stages').insert(
                    stages.map((s, i) => ({ tournament_id: id, name: s.name, description: s.description || null, start_date: toISO(s.start_date), sort_order: i }))
                )
            }

            // Update schedule
            await supabase.from('tournament_schedule').delete().eq('tournament_id', id)
            if (scheduleEntries.length > 0) {
                await supabase.from('tournament_schedule').insert(
                    scheduleEntries.map((s, i) => ({ tournament_id: id, title: s.title, description: s.description || null, match_date: toISO(s.match_date), sort_order: i }))
                )
            }

            // Update prize distribution
            await supabase.from('tournament_prizepool_distribution').delete().eq('tournament_id', id)
            if (prizeDistribution.length > 0) {
                await supabase.from('tournament_prizepool_distribution').insert(
                    prizeDistribution.map((p, i) => ({ tournament_id: id, place: p.place, prize: p.prize, sort_order: i }))
                )
            }

            await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_tournament', entity_type: 'tournament', entity_id: id, details: { name: form.name } })

            router.push('/admin/tournaments')
        } catch (err: any) {
            console.error('Update failed:', err)
            // Log full error object to see properties
            console.log('Full error object:', JSON.stringify(err, null, 2))

            const errorMessage = err?.message || err?.error_description || err?.details || 'Failed to update'
            setError(errorMessage)

            // Also alert the user just in case
            alert(`Update failed: ${errorMessage}`)

            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setSaving(true)
        try {
            const { error: deleteError } = await supabase.from('tournaments').delete().eq('id', id)
            if (deleteError) throw deleteError
            await supabase.from('audit_logs').insert({ user_id: (await supabase.auth.getUser()).data.user?.id, action: 'delete_tournament', entity_type: 'tournament', entity_id: id, details: { name: form.name } })
            router.push('/admin/tournaments')
        } catch (err: any) {
            console.error('Delete failed:', err)
            setError(err?.message || 'Failed to delete tournament')
            setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-gold animate-spin" /></div>

    return (
        <div className="p-6 md:p-8 max-w-3xl">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6"><ArrowLeft size={14} /> Back</Link>
            <h1 className="font-heading text-2xl font-bold mb-6">Edit <span className="text-gold">Tournament</span></h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div><label className="block text-sm text-text-secondary mb-1.5">Tournament Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
                        <div><label className="block text-sm text-text-secondary mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[100px] resize-y" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm text-text-secondary mb-1.5">Prize Pool</label><input type="text" value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} className="input-field" /></div>
                            <div><label className="block text-sm text-text-secondary mb-1.5">Server/Region</label><input type="text" value={form.server_region} onChange={(e) => setForm({ ...form, server_region: e.target.value })} className="input-field" /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="block text-sm text-text-secondary mb-1.5">Team Capacity</label><input type="number" value={form.total_team_capacity} onChange={(e) => setForm({ ...form, total_team_capacity: parseInt(e.target.value) || 20 })} className="input-field" /></div>
                            <div><label className="block text-sm text-text-secondary mb-1.5">Max Players/Team</label><input type="number" value={form.max_players_per_team} onChange={(e) => setForm({ ...form, max_players_per_team: parseInt(e.target.value) || 5 })} className="input-field" /></div>
                            <div><label className="block text-sm text-text-secondary mb-1.5">Teams per Group</label><input type="number" value={form.teams_per_group} onChange={(e) => setForm({ ...form, teams_per_group: parseInt(e.target.value) || 0 })} className="input-field" /></div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Prize Distribution</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">MVP Prize</label>
                            <input type="text" value={form.mvp_prize} onChange={(e) => setForm({ ...form, mvp_prize: e.target.value })} placeholder="e.g. 5,000 PKR" className="input-field" />
                        </div>

                        <div className="border-t border-border-primary pt-4 mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-sm font-bold text-gold">Placement Prizes</h3>
                                <button type="button" onClick={() => setPrizeDistribution([...prizeDistribution, { place: '', prize: '' }])} className="text-xs text-gold hover:text-gold-light flex items-center gap-1"><Plus size={14} /> Add Row</button>
                            </div>
                            <div className="space-y-3">
                                {prizeDistribution.map((entry, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <input type="text" placeholder="Place (e.g. 1st)" value={entry.place} onChange={(e) => { const s = [...prizeDistribution]; s[i].place = e.target.value; setPrizeDistribution(s) }} className="input-field text-sm flex-1" />
                                        <input type="text" placeholder="Prize (e.g. 25,000 PKR)" value={entry.prize} onChange={(e) => { const s = [...prizeDistribution]; s[i].prize = e.target.value; setPrizeDistribution(s) }} className="input-field text-sm flex-1" />
                                        <button type="button" onClick={() => setPrizeDistribution(prizeDistribution.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Dates & Times</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-1.5">Registration Start</label><input type="datetime-local" value={form.registration_start} onChange={(e) => setForm({ ...form, registration_start: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-sm text-text-secondary mb-1.5">Registration End</label><input type="datetime-local" value={form.registration_end} onChange={(e) => setForm({ ...form, registration_end: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-sm text-text-secondary mb-1.5">Match Start</label><input type="datetime-local" value={form.match_start} onChange={(e) => setForm({ ...form, match_start: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-sm text-text-secondary mb-1.5">Match End</label><input type="datetime-local" value={form.match_end} onChange={(e) => setForm({ ...form, match_end: e.target.value })} className="input-field" /></div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Settings</h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="w-4 h-4 rounded accent-gold" /><span className="text-sm text-text-secondary">Paid Registration</span></label>
                        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 rounded accent-gold" /><span className="text-sm text-text-secondary">Published</span></label>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gold">Roadmap Stages</h2>
                        <button type="button" onClick={() => setStages([...stages, { name: '', description: '', start_date: '' }])} className="text-xs text-gold hover:text-gold-light flex items-center gap-1"><Plus size={14} /> Add</button>
                    </div>
                    <div className="space-y-3">
                        {stages.map((stage, i) => (
                            <div key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-primary flex gap-3 items-start">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input type="text" placeholder="Stage name" value={stage.name} onChange={(e) => { const s = [...stages]; s[i].name = e.target.value; setStages(s) }} className="input-field text-sm" required />
                                    <input type="text" placeholder="Description" value={stage.description} onChange={(e) => { const s = [...stages]; s[i].description = e.target.value; setStages(s) }} className="input-field text-sm" />
                                    <input type="datetime-local" value={stage.start_date} onChange={(e) => { const s = [...stages]; s[i].start_date = e.target.value; setStages(s) }} className="input-field text-sm" />
                                </div>
                                <button type="button" onClick={() => setStages(stages.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 mt-2"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gold">Match Schedule</h2>
                        <button type="button" onClick={() => setScheduleEntries([...scheduleEntries, { title: '', description: '', match_date: '' }])} className="text-xs text-gold hover:text-gold-light flex items-center gap-1"><Plus size={14} /> Add</button>
                    </div>
                    <div className="space-y-3">
                        {scheduleEntries.map((entry, i) => (
                            <div key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-primary flex gap-3 items-start">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input type="text" placeholder="Match title" value={entry.title} onChange={(e) => { const s = [...scheduleEntries]; s[i].title = e.target.value; setScheduleEntries(s) }} className="input-field text-sm" required />
                                    <input type="text" placeholder="Description" value={entry.description} onChange={(e) => { const s = [...scheduleEntries]; s[i].description = e.target.value; setScheduleEntries(s) }} className="input-field text-sm" />
                                    <input type="datetime-local" value={entry.match_date} onChange={(e) => { const s = [...scheduleEntries]; s[i].match_date = e.target.value; setScheduleEntries(s) }} className="input-field text-sm" required />
                                </div>
                                <button type="button" onClick={() => setScheduleEntries(scheduleEntries.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 mt-2"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn-gold flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Changes
                    </button>
                    <button type="button" onClick={() => {
                        if (window.confirm('Are you sure you want to delete this tournament? This action cannot be undone and will delete all related data (stages, schedule, registrations).')) {
                            handleDelete()
                        }
                    }} disabled={saving} className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <Trash2 size={14} /> Delete
                    </button>
                    <Link href="/admin/tournaments" className="btn-outline">Cancel</Link>
                </div>
            </form>
        </div>
    )
}
