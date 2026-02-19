'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User as UserIcon, Save, Loader2, Plus, Trash2, Shield, Gamepad2, Users } from 'lucide-react'
import type { User } from '@/lib/types'

interface TeamMember {
    ign: string
    character_id: string
    is_captain: boolean
}

interface TeamProfile {
    team_name: string
    game: string
    members: TeamMember[]
}

export default function ProfilePage() {
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [fullName, setFullName] = useState('')
    const [team, setTeam] = useState<TeamProfile>({
        team_name: '',
        game: 'pubg_mobile',
        members: [{ ign: '', character_id: '', is_captain: true }],
    })

    useEffect(() => { loadProfile() }, [])

    const loadProfile = async () => {
        try {
            const { data: { user: au } } = await supabase.auth.getUser()
            if (!au) return

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', au.id)
                .single()

            if (profile) {
                setUser(profile as User)
                setFullName(profile.full_name || '')

                // Load saved team profile from localStorage (or custom_data column if available)
                const savedTeam = localStorage.getItem(`zenith_team_${au.id}`)
                if (savedTeam) {
                    try {
                        setTeam(JSON.parse(savedTeam))
                    } catch { /* ignore parse errors */ }
                }
            }
        } catch {
            // handle error
        } finally {
            setLoading(false)
        }
    }

    const saveProfile = async () => {
        if (!user) return
        setSaving(true)
        setMessage('')

        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: fullName, updated_at: new Date().toISOString() })
                .eq('id', user.id)

            if (error) throw error

            // Save team profile to localStorage
            localStorage.setItem(`zenith_team_${user.id}`, JSON.stringify(team))

            setMessage('Profile saved successfully!')
        } catch {
            setMessage('Failed to save profile')
        }
        setSaving(false)
    }

    const addMember = () => {
        if (team.members.length >= 6) return
        setTeam({
            ...team,
            members: [...team.members, { ign: '', character_id: '', is_captain: false }],
        })
    }

    const removeMember = (index: number) => {
        if (team.members.length <= 1) return
        const updated = team.members.filter((_, i) => i !== index)
        // Ensure at least one captain
        if (!updated.some(m => m.is_captain) && updated.length > 0) {
            updated[0].is_captain = true
        }
        setTeam({ ...team, members: updated })
    }

    const updateMember = (index: number, field: keyof TeamMember, value: string | boolean) => {
        const updated = [...team.members]
        if (field === 'is_captain') {
            // Only one captain at a time
            updated.forEach(m => m.is_captain = false)
            updated[index].is_captain = true
        } else if (field === 'ign') {
            updated[index].ign = value as string
        } else if (field === 'character_id') {
            updated[index].character_id = value as string
        }
        setTeam({ ...team, members: updated })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="text-gold animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <UserIcon size={48} className="text-gold/20 mx-auto mb-4" />
                <h1 className="font-heading text-2xl font-bold mb-2">Not Signed In</h1>
                <p className="text-text-muted text-sm">Please sign in to view your profile.</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
                My <span className="text-gold">Profile</span>
            </h1>
            <p className="text-text-muted text-sm mb-8">Manage your personal info and team details</p>

            {/* User Info */}
            <div className="glass-card-gold p-6 mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-lg font-bold shrink-0">
                        {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-heading text-lg font-bold">Account Info</h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span>{user.email}</span>
                            {user.role !== 'user' && (
                                <span className="inline-flex items-center gap-1 text-gold">
                                    <Shield size={10} />
                                    {user.role.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Display Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input-field"
                        placeholder="Your name"
                    />
                </div>
            </div>

            {/* Team Info */}
            <div className="glass-card p-6 mb-6">
                <div className="flex items-center gap-2 mb-5">
                    <Users size={20} className="text-gold" />
                    <h2 className="font-heading text-lg font-bold">My Team</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Team Name</label>
                            <input
                                type="text"
                                value={team.team_name}
                                onChange={(e) => setTeam({ ...team, team_name: e.target.value })}
                                className="input-field"
                                placeholder="e.g. Team Zenith"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Game</label>
                            <div className="relative">
                                <Gamepad2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <select
                                    value={team.game}
                                    onChange={(e) => setTeam({ ...team, game: e.target.value })}
                                    className="input-field pl-10"
                                >
                                    <option value="pubg_mobile">PUBG Mobile</option>
                                    <option value="valorant">Valorant</option>
                                    <option value="free_fire">Free Fire</option>
                                    <option value="cod_mobile">COD Mobile</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-text-secondary font-medium">
                                Team Members ({team.members.length}/6)
                            </label>
                            <button
                                onClick={addMember}
                                disabled={team.members.length >= 6}
                                className="text-xs text-gold hover:text-gold-light flex items-center gap-1 disabled:opacity-40"
                            >
                                <Plus size={12} /> Add Member
                            </button>
                        </div>

                        <div className="space-y-3">
                            {team.members.map((member, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-xl border transition-all ${member.is_captain
                                        ? 'bg-gold/5 border-gold/20'
                                        : 'bg-bg-secondary border-border-primary'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={() => updateMember(i, 'is_captain', true)}
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${member.is_captain
                                                ? 'bg-gold/20 text-gold border border-gold/30'
                                                : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
                                                }`}
                                        >
                                            {member.is_captain ? '★ Captain' : 'Set Captain'}
                                        </button>
                                        <span className="text-xs text-text-muted">Player {i + 1}</span>
                                        <div className="flex-1" />
                                        {team.members.length > 1 && (
                                            <button
                                                onClick={() => removeMember(i)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={member.ign}
                                            onChange={(e) => updateMember(i, 'ign', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="In-Game Name (IGN)"
                                        />
                                        <input
                                            type="text"
                                            value={member.character_id}
                                            onChange={(e) => updateMember(i, 'character_id', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="Character ID"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes('success')
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    {message}
                </div>
            )}

            <button
                onClick={saveProfile}
                disabled={saving}
                className="btn-gold flex items-center gap-2"
            >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Profile
            </button>
        </div>
    )
}
