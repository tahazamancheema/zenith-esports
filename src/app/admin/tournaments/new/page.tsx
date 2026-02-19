'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function NewTournamentPage() {
    const router = useRouter()
    const supabase = createClient()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        name: '', description: '', prize_pool: '', server_region: 'Asia',
        total_team_capacity: 20, max_players_per_team: 5, teams_per_group: 0,
        is_paid: false, is_published: false,
        registration_start: '', registration_end: '', match_start: '', match_end: '',
        mvp_prize: '',
    })

    const [posterFile, setPosterFile] = useState<File | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)

    const [stages, setStages] = useState<{ name: string; description: string; start_date: string }[]>([])
    const [scheduleEntries, setScheduleEntries] = useState<{ title: string; description: string; match_date: string }[]>([])
    const [prizeDistribution, setPrizeDistribution] = useState<{ place: string; prize: string }[]>([])

    const [loadingMessage, setLoadingMessage] = useState('')

    const uploadFileWithTimeout = async (file: File, path: string) => {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), 30000))
        const upload = async () => {
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const fullPath = `${path}/${fileName}`
            const { error } = await supabase.storage.from('uploads').upload(fullPath, file)
            if (error) {
                // If bucket doesn't exist, skip
                if (error.message.includes('not found') || error.message.includes('Bucket')) return ''
                throw error
            }
            const { data } = supabase.storage.from('uploads').getPublicUrl(fullPath)
            return data.publicUrl
        }
        return Promise.race([upload(), timeout]) as Promise<string>
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setLoadingMessage('Checking session...')

        // Helper to convert local datetime-local string to ISO UTC
        const toISO = (dateStr: string) => dateStr ? new Date(dateStr).toISOString() : null

        try {
            // timeout for auth check (5 seconds)
            const authTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timed out. Please refresh the page and sign in again.')), 15000))
            const authCheck = supabase.auth.getUser()

            // Try to get session from local storage first
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
                // @ts-ignore
                const result = await Promise.race([authCheck, authTimeout]) as any
                if (result.error || !result.data?.user) {
                    throw new Error('Session expired. Please sign in again.')
                }
            }

            let user = session?.user ?? null
            if (!user) {
                const { data } = await supabase.auth.getUser()
                user = data.user
            }

            if (!user) throw new Error('Session expired. Please sign in again.')

            // Validations
            if (form.total_team_capacity < 2) {
                throw new Error('Total team capacity must be at least 2')
            }

            let posterUrl = ''
            let logoUrl = ''

            if (posterFile || logoFile) {
                setLoadingMessage('Uploading images...')
                try {
                    if (posterFile) posterUrl = await uploadFileWithTimeout(posterFile, 'tournament-posters')
                    if (logoFile) logoUrl = await uploadFileWithTimeout(logoFile, 'tournament-logos')
                } catch (uploadErr) {
                    console.error('File upload failed or timed out:', uploadErr)
                    if (!window.confirm('Image upload failed or timed out. Continue without images?')) {
                        setSaving(false)
                        return
                    }
                }
            }

            setLoadingMessage('Creating tournament record...')
            const { data: tournament, error: createError } = await supabase
                .from('tournaments')
                .insert({
                    ...form,
                    poster_url: posterUrl || null,
                    logo_url: logoUrl || null,
                    registration_start: toISO(form.registration_start),
                    registration_end: toISO(form.registration_end),
                    match_start: toISO(form.match_start),
                    match_end: toISO(form.match_end),
                    created_by: user.id,
                })
                .select()
                .single()

            if (createError) throw createError

            // Create stages
            if (stages.length > 0) {
                setLoadingMessage('Saving stages...')
                const { error: stageErr } = await supabase.from('tournament_stages').insert(
                    stages.map((s, i) => ({
                        tournament_id: tournament.id,
                        name: s.name,
                        description: s.description || null,
                        start_date: toISO(s.start_date),
                        sort_order: i,
                    }))
                )
                if (stageErr) console.error('Stages error:', stageErr)
            }

            // Create schedule
            if (scheduleEntries.length > 0) {
                setLoadingMessage('Saving schedule...')
                const { error: schedErr } = await supabase.from('tournament_schedule').insert(
                    scheduleEntries.map((s, i) => ({
                        tournament_id: tournament.id,
                        title: s.title,
                        description: s.description || null,
                        match_date: toISO(s.match_date),
                        sort_order: i,
                    }))
                )
                if (schedErr) console.error('Schedule error:', schedErr)
            }

            // Create prize distribution
            if (prizeDistribution.length > 0) {
                setLoadingMessage('Saving prize distribution...')
                const { error: prizeErr } = await supabase.from('tournament_prizepool_distribution').insert(
                    prizeDistribution.map((p, i) => ({
                        tournament_id: tournament.id,
                        place: p.place,
                        prize: p.prize,
                        sort_order: i
                    }))
                )
                if (prizeErr) console.error('Prize dist error:', prizeErr)
            }

            // Log audit
            setLoadingMessage('Finalizing...')
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'create_tournament',
                entity_type: 'tournament',
                entity_id: tournament.id,
                details: { name: tournament.name },
            })

            router.push('/admin/tournaments')
        } catch (err: any) {
            console.error('Tournament creation failed details:', err)
            const errorMsg = err?.message || err?.error_description || 'Failed to create tournament.'
            setError(errorMsg)
            window.alert(`Error: ${errorMsg}\n\nCheck if you ran the 'fix-rls.sql' script in Supabase!`)
        } finally {
            setSaving(false)
            setLoadingMessage('')
        }
    }

    return (
        <div className="p-6 md:p-8 max-w-3xl">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6">
                <ArrowLeft size={14} /> Back
            </Link>

            <h1 className="font-heading text-2xl font-bold mb-6">Create <span className="text-gold">Tournament</span></h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Tournament Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[100px] resize-y" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1.5">Prize Pool</label>
                                <input type="text" value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} placeholder="e.g. PKR 50,000" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1.5">Server/Region</label>
                                <input type="text" value={form.server_region} onChange={(e) => setForm({ ...form, server_region: e.target.value })} className="input-field" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1.5">Team Capacity</label>
                                <input type="number" value={form.total_team_capacity} onChange={(e) => setForm({ ...form, total_team_capacity: parseInt(e.target.value) || 20 })} className="input-field" min={1} />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1.5">Max Players/Team</label>
                                <input type="number" value={form.max_players_per_team} onChange={(e) => setForm({ ...form, max_players_per_team: parseInt(e.target.value) || 5 })} className="input-field" min={4} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prize Distribution */}
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

                {/* Media */}
                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Media</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Tournament Poster</label>
                            <input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="input-field text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Tournament Logo</label>
                            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="input-field text-sm" />
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Dates & Times</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Registration Start</label>
                            <input type="datetime-local" value={form.registration_start} onChange={(e) => setForm({ ...form, registration_start: e.target.value })} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Registration End</label>
                            <input type="datetime-local" value={form.registration_end} onChange={(e) => setForm({ ...form, registration_end: e.target.value })} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Match Start</label>
                            <input type="datetime-local" value={form.match_start} onChange={(e) => setForm({ ...form, match_start: e.target.value })} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Match End</label>
                            <input type="datetime-local" value={form.match_end} onChange={(e) => setForm({ ...form, match_end: e.target.value })} className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Settings</h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="w-4 h-4 rounded accent-gold" />
                            <span className="text-sm text-text-secondary">Paid Registration (require payment proof)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 rounded accent-gold" />
                            <span className="text-sm text-text-secondary">Publish tournament (visible to public)</span>
                        </label>
                    </div>
                </div>

                {/* Roadmap Stages */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gold">Roadmap Stages</h2>
                        <button type="button" onClick={() => setStages([...stages, { name: '', description: '', start_date: '' }])} className="text-xs text-gold hover:text-gold-light flex items-center gap-1">
                            <Plus size={14} /> Add Stage
                        </button>
                    </div>
                    {stages.length > 0 ? (
                        <div className="space-y-3">
                            {stages.map((stage, i) => (
                                <div key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-primary flex gap-3 items-start">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input type="text" placeholder="Stage name" value={stage.name} onChange={(e) => { const s = [...stages]; s[i].name = e.target.value; setStages(s) }} className="input-field text-sm" required />
                                        <input type="text" placeholder="Description" value={stage.description} onChange={(e) => { const s = [...stages]; s[i].description = e.target.value; setStages(s) }} className="input-field text-sm" />
                                        <input type="datetime-local" value={stage.start_date} onChange={(e) => { const s = [...stages]; s[i].start_date = e.target.value; setStages(s) }} className="input-field text-sm" />
                                    </div>
                                    <button type="button" onClick={() => setStages(stages.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 mt-2">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted">No stages added. Add stages to create a visual roadmap timeline.</p>
                    )}
                </div>

                {/* Schedule */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gold">Match Schedule</h2>
                        <button type="button" onClick={() => setScheduleEntries([...scheduleEntries, { title: '', description: '', match_date: '' }])} className="text-xs text-gold hover:text-gold-light flex items-center gap-1">
                            <Plus size={14} /> Add Entry
                        </button>
                    </div>
                    {scheduleEntries.length > 0 ? (
                        <div className="space-y-3">
                            {scheduleEntries.map((entry, i) => (
                                <div key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-primary flex gap-3 items-start">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input type="text" placeholder="Match title" value={entry.title} onChange={(e) => { const s = [...scheduleEntries]; s[i].title = e.target.value; setScheduleEntries(s) }} className="input-field text-sm" required />
                                        <input type="text" placeholder="Description" value={entry.description} onChange={(e) => { const s = [...scheduleEntries]; s[i].description = e.target.value; setScheduleEntries(s) }} className="input-field text-sm" />
                                        <input type="datetime-local" value={entry.match_date} onChange={(e) => { const s = [...scheduleEntries]; s[i].match_date = e.target.value; setScheduleEntries(s) }} className="input-field text-sm" required />
                                    </div>
                                    <button type="button" onClick={() => setScheduleEntries(scheduleEntries.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 mt-2">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted">No schedule entries. Add match schedule entries for the calendar view.</p>
                    )}
                </div>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn-gold flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving && loadingMessage ? loadingMessage : 'Create Tournament'}
                    </button>
                    <Link href="/admin/tournaments" className="btn-outline">Cancel</Link>
                </div>
            </form>
        </div>
    )
}
