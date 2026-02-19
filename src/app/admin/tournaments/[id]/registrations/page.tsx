'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDatePKT, getStatusColor } from '@/lib/utils'
import { ArrowLeft, CheckCircle, XCircle, Eye, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import type { Registration, Player, Upload } from '@/lib/types'

export default function RegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [uploads, setUploads] = useState<Upload[]>([])
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => { loadRegistrations() }, [id])

    const loadRegistrations = async () => {
        const { data } = await supabase
            .from('registrations')
            .select('*')
            .eq('tournament_id', id)
            .order('created_at', { ascending: false })
        setRegistrations((data || []) as Registration[])
        setLoading(false)
    }

    const viewDetails = async (reg: Registration) => {
        setSelectedReg(reg)
        const [playersRes, uploadsRes] = await Promise.all([
            supabase.from('players').select('*').eq('registration_id', reg.id).order('sort_order'),
            supabase.from('uploads').select('*').eq('registration_id', reg.id),
        ])
        setPlayers((playersRes.data || []) as Player[])
        setUploads((uploadsRes.data || []) as Upload[])
    }

    const updateStatus = async (regId: string, newStatus: 'approved' | 'rejected') => {
        setProcessing(regId)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // If rejecting, we need to clear slot and group first (or simultaneously)
            if (newStatus === 'rejected') {
                // Clear slot
                await supabase
                    .from('slots')
                    .update({ registration_id: null, assigned_at: null, assigned_by: null })
                    .eq('registration_id', regId)

                // Update registration (status + clear group)
                const { error } = await supabase
                    .from('registrations')
                    .update({
                        status: newStatus,
                        group_id: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', regId)

                if (error) throw error
            } else {
                // Normal update for approval
                const { error } = await supabase
                    .from('registrations')
                    .update({ status: newStatus, updated_at: new Date().toISOString() })
                    .eq('id', regId)

                if (error) throw error
            }

            // If approving, we just set status to approved (no slot assignment)
            if (newStatus === 'approved') {
                // No action needed other than status update which is done above
            }

            // Audit log
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: newStatus === 'approved' ? 'approve_registration' : 'reject_registration',
                entity_type: 'registration',
                entity_id: regId,
                details: { tournament_id: id, status: newStatus },
            })

            loadRegistrations()
            if (selectedReg?.id === regId) setSelectedReg(null)
        } catch {
            alert('Failed to update status')
        }
        setProcessing(null)
    }

    const filtered = filter === 'all' ? registrations : registrations.filter(r => r.status === filter)

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-gold animate-spin" /></div>

    return (
        <div className="p-6 md:p-8">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6"><ArrowLeft size={14} /> Back</Link>
            <h1 className="font-heading text-2xl font-bold mb-6">Team <span className="text-gold">Registrations</span></h1>

            {/* Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'pending', 'approved', 'rejected', 'assigned_slot'].map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-gold/20 text-gold' : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'}`}>
                        {f === 'all' ? 'All' : f.replace('_', ' ').toUpperCase()} ({f === 'all' ? registrations.length : registrations.filter(r => r.status === f).length})
                    </button>
                ))}
            </div>

            <div className="flex gap-6">
                {/* List */}
                <div className="flex-1 space-y-3">
                    {filtered.length > 0 ? filtered.map((reg) => (
                        <div key={reg.id} className={`glass-card p-4 cursor-pointer transition-colors ${selectedReg?.id === reg.id ? 'border-gold/40' : 'hover:border-gold/20'}`} onClick={() => viewDetails(reg)}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {reg.team_logo_url ? (
                                        <img src={reg.team_logo_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0"><Users size={16} className="text-gold" /></div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-heading font-bold text-sm truncate">{reg.team_name}</h3>
                                        <p className="text-xs text-text-muted">{formatDatePKT(reg.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge text-xs ${getStatusColor(reg.status)}`}>{reg.status.replace('_', ' ')}</span>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1">
                                        {reg.status === 'pending' && (
                                            <button onClick={(e) => { e.stopPropagation(); updateStatus(reg.id, 'approved') }} disabled={processing === reg.id} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Approve">
                                                {processing === reg.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                            </button>
                                        )}
                                        {['pending', 'approved', 'assigned_slot'].includes(reg.status) && (
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to reject/remove this team?')) updateStatus(reg.id, 'rejected') }} disabled={processing === reg.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Reject / Remove">
                                                <XCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="glass-card p-8 text-center"><p className="text-text-muted text-sm">No registrations found</p></div>
                    )}
                </div>

                {/* Detail Panel */}
                {selectedReg && (
                    <div className="hidden lg:block w-96 shrink-0">
                        <div className="glass-card p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-heading text-lg font-bold text-gold">{selectedReg.team_name}</h2>
                                <button onClick={() => setSelectedReg(null)} className="text-text-muted hover:text-text-primary"><XCircle size={16} /></button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div><span className="text-text-muted">Status:</span> <span className={`badge ml-2 ${getStatusColor(selectedReg.status)}`}>{selectedReg.status.replace('_', ' ')}</span></div>
                                <div><span className="text-text-muted">WhatsApp:</span> <span className="text-text-secondary ml-2">{selectedReg.whatsapp_normalized}</span></div>
                                <div><span className="text-text-muted">Raw Input:</span> <span className="text-text-secondary ml-2">{selectedReg.whatsapp_raw}</span></div>
                                {selectedReg.discord && <div><span className="text-text-muted">Discord:</span> <span className="text-text-secondary ml-2">{selectedReg.discord}</span></div>}
                            </div>

                            {/* Players */}
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gold mb-3">Players ({players.length})</h3>
                                <div className="space-y-2">
                                    {players.map((p) => (
                                        <div key={p.id} className="p-2 rounded-lg bg-bg-secondary text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{p.ign} {p.is_captain ? '(C)' : ''}</span>
                                                <span className="text-text-muted">ID: {p.character_id}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Uploads */}
                            {uploads.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold text-gold mb-3">Uploads ({uploads.length})</h3>
                                    <div className="space-y-2">
                                        {uploads.map((u) => (
                                            <a key={u.id} href={u.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-bg-secondary text-xs text-text-secondary hover:text-gold transition-colors">
                                                <Eye size={12} />
                                                <span className="truncate">{u.field_name || u.upload_type} — {u.file_name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 flex flex-col gap-2">
                                {selectedReg.status === 'pending' && (
                                    <button onClick={() => updateStatus(selectedReg.id, 'approved')} disabled={processing === selectedReg.id} className="btn-gold text-xs w-full flex items-center justify-center gap-1 py-2">
                                        <CheckCircle size={12} /> Approve
                                    </button>
                                )}
                                {['pending', 'approved', 'assigned_slot'].includes(selectedReg.status) && (
                                    <button onClick={() => { if (confirm('Are you sure you want to reject/remove this team?')) updateStatus(selectedReg.id, 'rejected') }} disabled={processing === selectedReg.id} className="btn-red text-xs w-full flex items-center justify-center gap-1 py-2">
                                        <XCircle size={12} /> Reject / Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
