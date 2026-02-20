'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeWhatsApp } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Plus, Minus, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Tournament, RegistrationFormConfig } from '@/lib/types'

export default function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()

    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [formConfig, setFormConfig] = useState<RegistrationFormConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Form state
    const [teamName, setTeamName] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [discord, setDiscord] = useState('')
    const [teamLogo, setTeamLogo] = useState<File | null>(null)
    const [players, setPlayers] = useState([
        { ign: '', character_id: '', discord: '' },
        { ign: '', character_id: '', discord: '' },
        { ign: '', character_id: '', discord: '' },
        { ign: '', character_id: '', discord: '' },
    ])
    const [customFields, setCustomFields] = useState<Record<string, string>>({})
    const [verificationFiles, setVerificationFiles] = useState<Record<string, File>>({})
    const [paymentProof, setPaymentProof] = useState<File | null>(null)

    useEffect(() => {
        loadTournament()
        checkUser()
    }, [id])

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            const { data: reg } = await supabase
                .from('registrations')
                .select('status')
                .eq('tournament_id', id)
                .eq('user_id', session.user.id)
                .neq('status', 'rejected')
                .maybeSingle()

            if (reg) {
                setSuccess(true)
            }
        }
    }

    const loadTournament = async () => {
        try {
            const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single()
            setTournament(t as Tournament)

            const { data: config } = await supabase
                .from('registration_form_config')
                .select('*')
                .eq('tournament_id', id)
                .eq('is_enabled', true)
                .order('sort_order')
            setFormConfig((config || []) as RegistrationFormConfig[])
        } catch {
            setError('Failed to load tournament')
        } finally {
            setLoading(false)
        }
    }

    const addPlayer = () => {
        if (tournament && players.length < tournament.max_players_per_team) {
            setPlayers([...players, { ign: '', character_id: '', discord: '' }])
        }
    }

    const removePlayer = (index: number) => {
        if (players.length > 4) {
            setPlayers(players.filter((_, i) => i !== index))
        }
    }

    const updatePlayer = (index: number, field: string, value: string) => {
        const updated = [...players]
        updated[index] = { ...updated[index], [field]: value }
        setPlayers(updated)
    }

    const [loadingMessage, setLoadingMessage] = useState('')

    const uploadFileWithTimeout = async (file: File, path: string): Promise<string> => {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), 30000))
        const upload = async () => {
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const fullPath = `${path}/${fileName}`
            const { error } = await supabase.storage.from('uploads').upload(fullPath, file)

            // If bucket doesn't exist, we can't upload. Throw specifically so we can catch it.
            if (error) throw error

            const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fullPath)
            return urlData.publicUrl
        }
        return Promise.race([upload(), timeout]) as Promise<string>
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setLoadingMessage('Checking session...')

        try {
            // Try to get session from local storage first
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            let user = session?.user

            if (!user) {
                const { data: { user: u }, error: authError } = await supabase.auth.getUser()
                user = u || undefined
                if (authError || !user) {
                    router.push(`/login?redirect=/tournaments/${id}/register`)
                    return
                }
            }

            // Check if user already registered
            const { data: existingReg } = await supabase
                .from('registrations')
                .select('id')
                .eq('tournament_id', id)
                .eq('user_id', user.id)
                .neq('status', 'rejected')
                .maybeSingle()

            if (existingReg) {
                throw new Error('You have already registered for this tournament.')
            }

            // Validate minimum players
            const validPlayers = players.filter(p => p.ign && p.character_id)
            if (validPlayers.length < 4) {
                throw new Error('You need at least 4 players with IGN and Character ID')
            }

            // Validate Character IDs (Numeric, 5-15 digits)
            for (const p of validPlayers) {
                if (!/^\d{5,15}$/.test(p.character_id)) {
                    throw new Error(`Invalid Character ID for ${p.ign}: Must be 5-15 digits.`)
                }
            }

            // Check for duplicate Character IDs within the team
            const charIds = validPlayers.map(p => p.character_id)
            const duplicateCharId = charIds.find((item, index) => charIds.indexOf(item) !== index)
            if (duplicateCharId) {
                throw new Error(`Duplicate Character ID found: ${duplicateCharId}. Each player must have a unique ID.`)
            }

            // Check for duplicate IGNs within the team
            const igns = validPlayers.map(p => p.ign.toLowerCase())
            const duplicateIgnIndex = igns.findIndex((item, index) => igns.indexOf(item) !== index)
            if (duplicateIgnIndex !== -1) {
                // Get the original casing for the error message
                const originalIgn = validPlayers[duplicateIgnIndex].ign
                throw new Error(`Duplicate IGN found: ${originalIgn}. Each player must have a unique In-Game Name.`)
            }

            // Normalize WhatsApp
            const normalized = normalizeWhatsApp(whatsapp)

            // Check for conflicts (WhatsApp, Char ID, IGN) using RPC
            // Wrap in timeout to prevent hanging
            const validationPromise = supabase.rpc('check_registration_conflicts', {
                p_tournament_id: id,
                p_whatsapp: normalized,
                p_player_ids: validPlayers.map(p => p.character_id),
                p_player_igns: validPlayers.map(p => p.ign)
            })

            const validationTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Validation timed out. Please check your connection or contact support.')), 15000))

            try {
                // @ts-ignore
                const { data: conflict, error: rpcError } = await Promise.race([validationPromise, validationTimeout])

                if (rpcError) {
                    console.error('Validation RPC error:', rpcError)
                    // If function is missing, we allow registration to proceed but warn console
                    if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.status === 404) {
                        console.warn('Skipping conflict check: RPC function missing')
                    } else {
                        // Real error
                        throw new Error('Validation failed. Please try again.')
                    }
                } else if (conflict && conflict.conflict) {
                    throw new Error(conflict.message)
                }
            } catch (validationErr: any) {
                if (validationErr.message === 'Validation failed. Please try again.' || validationErr.message.includes('Validation timed out')) {
                    throw validationErr
                }
                // If it was a conflict error thrown above, rethrow it
                if (validationErr.message && !validationErr.message.includes('missing')) {
                    throw validationErr
                }
            }

            // Upload team logo
            let teamLogoUrl = ''
            if (teamLogo) {
                setLoadingMessage('Uploading team logo...')
                try {
                    teamLogoUrl = await uploadFileWithTimeout(teamLogo, `team-logos/${id}`)
                } catch (err) {
                    console.error('Logo upload error:', err)
                    if (!window.confirm('Team logo upload failed (likely missing permissions). Continue without logo?')) {
                        setSubmitting(false); return;
                    }
                }
            }

            // Create registration
            setLoadingMessage('Creating registration...')
            const { data: registration, error: regError } = await supabase
                .from('registrations')
                .insert({
                    tournament_id: id,
                    user_id: user.id,
                    team_name: teamName,
                    team_logo_url: teamLogoUrl || null,
                    whatsapp_raw: whatsapp,
                    whatsapp_normalized: normalized,
                    discord: discord || null,
                    status: 'pending',
                    custom_fields: customFields,
                })
                .select()
                .single()

            if (regError) throw regError

            // Insert players
            setLoadingMessage('Saving player roster...')
            const playerData = validPlayers.map((p, i) => ({
                registration_id: registration.id,
                ign: p.ign,
                character_id: p.character_id,
                discord: p.discord || null,
                is_captain: i === 0,
                sort_order: i,
            }))

            const { error: playerError } = await supabase.from('players').insert(playerData)
            if (playerError) throw playerError

            // Upload verification files
            if (Object.keys(verificationFiles).length > 0) {
                setLoadingMessage('Uploading verification files...')
                for (const [fieldName, file] of Object.entries(verificationFiles)) {
                    try {
                        const fileUrl = await uploadFileWithTimeout(file, `verification/${id}/${registration.id}`)
                        await supabase.from('uploads').insert({
                            registration_id: registration.id,
                            upload_type: 'verification',
                            field_name: fieldName,
                            file_url: fileUrl,
                            file_name: file.name,
                        })
                    } catch (err) {
                        console.error('Verification upload failed:', err)
                        // Verify non-fatal? For now, alert but continue
                    }
                }
            }

            // Upload payment proof
            if (paymentProof && tournament?.is_paid) {
                setLoadingMessage('Uploading payment proof...')
                try {
                    const fileUrl = await uploadFileWithTimeout(paymentProof, `payment-proofs/${id}/${registration.id}`)
                    await supabase.from('uploads').insert({
                        registration_id: registration.id,
                        upload_type: 'payment_proof',
                        field_name: 'payment_proof',
                        file_url: fileUrl,
                        file_name: paymentProof.name,
                    })
                } catch (err) {
                    console.error('Payment proof upload failed:', err)
                }
            }

            setSuccess(true)
        } catch (err: any) {
            const message = err?.message || err?.error_description || 'Registration failed. You may have already registered.'
            console.error('Registration failed:', err)
            setError(message)

        } finally {
            setSubmitting(false)
            setLoadingMessage('')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="text-gold animate-spin" />
            </div>
        )
    }

    if (success) {
        return (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h1 className="font-heading text-2xl font-bold mb-2">Registration Submitted!</h1>
                <p className="text-text-muted mb-6">Your team has been registered. Please wait for <strong>Admin Verification</strong>. Once verified, your team will appear in the tournament team list.</p>
                <div className="flex gap-3 justify-center">
                    <Link href="/dashboard" className="btn-gold">View Dashboard</Link>
                    <Link href={`/tournaments/${id}`} className="btn-outline">Back to Tournament</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <Link href={`/tournaments/${id}`} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6">
                <ArrowLeft size={14} /> Back to Tournament
            </Link>

            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
                Register for <span className="text-gold">{tournament?.name}</span>
            </h1>
            <p className="text-text-muted text-sm mb-8">Fill in your team details to register</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Info */}
                <div className="glass-card p-6">
                    <h2 className="font-heading text-lg font-bold text-gold mb-4">Team Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Team Name *</label>
                            <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Team Logo</label>
                            <input type="file" accept="image/*" onChange={(e) => setTeamLogo(e.target.files?.[0] || null)} className="input-field text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">WhatsApp Contact Number *</label>
                            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="03XX-XXXXXXX or +92XXXXXXXXXX" className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Discord (Optional)</label>
                            <input type="text" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username#1234" className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Players */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gold">Player Roster</h2>
                        <span className="text-xs text-text-muted">Min 4 • Max {tournament?.max_players_per_team || 5}</span>
                    </div>
                    <div className="space-y-4">
                        {players.map((player, i) => (
                            <div key={i} className="p-4 rounded-lg bg-bg-secondary border border-border-primary">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gold">Player {i + 1} {i === 0 ? '(Captain)' : ''}</span>
                                    {players.length > 4 && (
                                        <button type="button" onClick={() => removePlayer(i)} className="text-red-400 hover:text-red-300">
                                            <Minus size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1">In-Game Name *</label>
                                        <input type="text" value={player.ign} onChange={(e) => updatePlayer(i, 'ign', e.target.value)} className="input-field text-sm" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1">Character ID *</label>
                                        <input type="text" value={player.character_id} onChange={(e) => updatePlayer(i, 'character_id', e.target.value)} className="input-field text-sm" required />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tournament && players.length < tournament.max_players_per_team && (
                            <button type="button" onClick={addPlayer} className="w-full py-2.5 rounded-lg border border-dashed border-border-primary text-text-muted hover:text-gold hover:border-gold/30 transition-colors flex items-center justify-center gap-1 text-sm">
                                <Plus size={14} /> Add Player
                            </button>
                        )}
                    </div>
                </div>

                {/* Custom Fields */}
                {formConfig.filter(f => f.section === 'custom').length > 0 && (
                    <div className="glass-card p-6">
                        <h2 className="font-heading text-lg font-bold text-gold mb-4">Additional Information</h2>
                        <div className="space-y-4">
                            {formConfig.filter(f => f.section === 'custom').map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm text-text-secondary mb-1.5">
                                        {field.field_label} {field.is_required ? '*' : ''}
                                    </label>
                                    {field.field_type === 'textarea' ? (
                                        <textarea
                                            value={customFields[field.field_name] || ''}
                                            onChange={(e) => setCustomFields({ ...customFields, [field.field_name]: e.target.value })}
                                            className="input-field min-h-[80px] resize-y"
                                            required={field.is_required}
                                        />
                                    ) : field.field_type === 'dropdown' ? (
                                        <select
                                            value={customFields[field.field_name] || ''}
                                            onChange={(e) => setCustomFields({ ...customFields, [field.field_name]: e.target.value })}
                                            className="input-field"
                                            required={field.is_required}
                                        >
                                            <option value="">Select...</option>
                                            {(field.options || []).map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.field_type === 'file' ? (
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) setVerificationFiles({ ...verificationFiles, [field.field_name]: file })
                                            }}
                                            className="input-field text-sm"
                                            required={field.is_required}
                                        />
                                    ) : (
                                        <input
                                            type={field.field_type === 'number' ? 'number' : 'text'}
                                            value={customFields[field.field_name] || ''}
                                            onChange={(e) => setCustomFields({ ...customFields, [field.field_name]: e.target.value })}
                                            className="input-field"
                                            required={field.is_required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Verification Uploads */}
                {formConfig.filter(f => f.section === 'verification' && f.field_type === 'file').length > 0 && (
                    <div className="glass-card p-6">
                        <h2 className="font-heading text-lg font-bold text-gold mb-4">Verification Uploads</h2>
                        <div className="space-y-4">
                            {formConfig.filter(f => f.section === 'verification' && f.field_type === 'file').map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm text-text-secondary mb-1.5">
                                        {field.field_label} {field.is_required ? '*' : '(Optional)'}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) setVerificationFiles({ ...verificationFiles, [field.field_name]: file })
                                        }}
                                        className="input-field text-sm"
                                        required={field.is_required}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Proof */}
                {tournament?.is_paid && (
                    <div className="glass-card p-6">
                        <h2 className="font-heading text-lg font-bold text-gold mb-4">Payment Proof</h2>
                        <p className="text-text-muted text-sm mb-3">Upload a screenshot of your payment</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                            className="input-field text-sm"
                            required
                        />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
                )}

                {/* Submit */}
                <button type="submit" disabled={submitting} className="btn-gold w-full py-3 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {submitting && loadingMessage ? loadingMessage : 'Submit Registration'}
                </button>
            </form>
        </div>
    )
}
