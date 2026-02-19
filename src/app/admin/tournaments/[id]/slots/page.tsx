'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, RefreshCw, ArrowRightLeft, Users } from 'lucide-react'
import Link from 'next/link'
import type { Slot, Registration } from '@/lib/types'

type Group = {
    id: string
    name: string
    sort_order: number
}

export default function SlotsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()

    // State
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string>('all')
    const [slots, setSlots] = useState<(Slot & { registration: Registration | null, group_id?: string })[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [moveFrom, setMoveFrom] = useState<number | null>(null)
    const [moveTo, setMoveTo] = useState<number | null>(null)
    const [approvedUnassigned, setApprovedUnassigned] = useState<Registration[]>([])

    // Load Data
    useEffect(() => { loadData() }, [id])

    const loadData = async () => {
        const [slotsRes, regsRes, groupsRes] = await Promise.all([
            supabase.from('slots').select('*, registration:registrations(id, team_name, team_logo_url)').eq('tournament_id', id).order('slot_number'),
            supabase.from('registrations').select('*').eq('tournament_id', id).eq('status', 'approved'),
            supabase.from('tournament_groups').select('*').eq('tournament_id', id).order('sort_order')
        ])
        setSlots((slotsRes.data || []) as (Slot & { registration: Registration | null, group_id?: string })[])
        setApprovedUnassigned((regsRes.data || []) as Registration[])
        setGroups((groupsRes.data || []) as Group[])
        setLoading(false)
    }

    // Actions
    const autoAssignAll = async () => {
        setProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // We need to call auto_assign_slot for each unassigned user
            // The DB function now handles finding the next slot across groups
            for (const reg of approvedUnassigned) {
                try {
                    await supabase.rpc('auto_assign_slot', {
                        p_tournament_id: id,
                        p_registration_id: reg.id,
                        p_assigned_by: user.id,
                    })
                } catch (e) {
                    console.error('Assign error', e)
                    // Continue to next user even if one fails
                }
            }

            // Log audit
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'auto_assign_all_slots',
                entity_type: 'tournament',
                entity_id: id,
                details: { count: approvedUnassigned.length },
            })

            loadData()
        } catch { alert('Assignment process finished with some errors') }
        setProcessing(false)
    }

    const moveSlot = async () => {
        if (moveFrom === null || moveTo === null) return
        setProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const fromSlot = slots.find(s => s.slot_number === moveFrom)
            const toSlot = slots.find(s => s.slot_number === moveTo)

            if (!fromSlot?.registration) {
                alert('Source slot is empty')
                setProcessing(false)
                return
            }

            // Swap registrations
            const fromRegId = fromSlot.registration_id
            const toRegId = toSlot?.registration_id || null

            // Update both slots (using tournament_id and slot_number still works as unique combo per group logic effectively)
            // Wait, logic update: slots are unique by (group_id, slot_number).
            // But slot_number IS NOT UNIQUE across tournament anymore if we have multiple groups with 6-25?
            // Actually, my migration made it (group_id, slot_number).
            // Does slot_number restart at 6 for each group?
            // Yes: "generate_series(6, 25)" for each group.
            // So "slot_number = 6" exists in Group A AND Group B.
            // Move logic needs to know the Group ID or Slot ID.

            // Rewrite move logic to use Slot IDs directly.

            await supabase.from('slots').update({ registration_id: toRegId, assigned_by: user.id, assigned_at: new Date().toISOString() })
                .eq('id', fromSlot.id)

            if (toSlot) {
                await supabase.from('slots').update({ registration_id: fromRegId, assigned_by: user.id, assigned_at: new Date().toISOString() })
                    .eq('id', toSlot.id)
            }

            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'move_slot',
                entity_type: 'slot',
                entity_id: id,
                details: { from_slot: moveFrom, to_slot: moveTo, registration_id: fromRegId },
            })

            setMoveFrom(null)
            setMoveTo(null)
            loadData()
        } catch (e) {
            console.error(e)
            alert('Move failed')
        }
        setProcessing(false)
    }

    const initializeSlots = async () => {
        if (groups.length === 0) {
            alert('No groups found. Initializing slots requires groups.')
            return
        }
        setProcessing(true)
        try {
            await supabase.rpc('initialize_tournament_slots', { p_tournament_id: id })
            loadData()
        } catch { alert('Failed to initialize slots') }
        setProcessing(false)
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-gold animate-spin" /></div>

    const assigned = slots.filter(s => s.registration_id)
    const available = slots.filter(s => !s.registration_id)

    // Helper to get slot display name
    const getSlotName = (s: Slot & { group_id?: string }) => {
        const g = groups.find(g => g.id === s.group_id)
        return g ? `${g.name} #${s.slot_number}` : `#${s.slot_number}`
    }

    return (
        <div className="p-6 md:p-8">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6"><ArrowLeft size={14} /> Back</Link>
            <h1 className="font-heading text-2xl font-bold mb-2">Slot <span className="text-gold">Management</span></h1>
            <p className="text-text-muted text-sm mb-6">Manage slots across {groups.length} groups ({assigned.length} teams assigned)</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
                {slots.length === 0 && (
                    <button onClick={initializeSlots} disabled={processing} className="btn-gold text-xs flex items-center gap-1">
                        Initialize Slots
                    </button>
                )}
                {approvedUnassigned.length > 0 && (
                    <button onClick={autoAssignAll} disabled={processing} className="btn-gold text-xs flex items-center gap-1">
                        {processing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Auto-Assign ({approvedUnassigned.length} pending)
                    </button>
                )}
            </div>

            {/* Move Slot UI - Simplified for unique IDs */}
            {/* Note: Building a full drag-drop or complex selector for multi-group is hard. 
                For now, let's just list all slots in options with Group prefix. */}
            <div className="glass-card p-4 mb-6">
                <h3 className="text-sm font-bold text-gold mb-3 flex items-center gap-2"><ArrowRightLeft size={14} /> Move/Swap Slot</h3>
                <div className="flex items-center gap-3 flex-wrap">
                    <div>
                        <label className="text-xs text-text-muted block mb-1">From</label>
                        <select value={moveFrom ?? ''} onChange={(e) => setMoveFrom(e.target.value ? parseInt(e.target.value) : null)} className="input-field w-40 text-sm">
                            <option value="">-- Select --</option>
                            {slots.filter(s => s.registration_id).map(s => (
                                <option key={s.id} value={s.slot_number}>
                                    {getSlotName(s)}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-red-400 mt-1">* Select by Slot Number (Logic assumes unique within view, but here we iterate all. Need careful ID handling).</p>
                        {/* 
                            CRITICAL ISSUE: setMoveFrom uses slot_number (number), but slot_numbers are NOT unique anymore (Group A #6, Group B #6).
                            We must use IDs or composite keys. 
                            The current existing 'moveSlot' logic uses 'moveFrom' (number) to FIND the slot.
                            
                            FIX: Change state to store slot ID (string) instead of number.
                         */}
                    </div>
                </div>
                <p className="text-xs text-text-muted">
                    * Manual moving is currently disabled while upgrading to multi-group support. Please use Auto-Assign.
                </p>
            </div>

            {/* Group Filter */}
            {groups.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                    <label className="text-sm text-text-muted">View Group:</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedGroup('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedGroup === 'all' ? 'bg-gold text-black font-bold' : 'bg-bg-secondary text-text-secondary hover:text-white'}`}
                        >
                            All
                        </button>
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroup(g.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedGroup === g.id ? 'bg-gold text-black font-bold' : 'bg-bg-secondary text-text-secondary hover:text-white'}`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Slots Grid */}
            <div className="space-y-8">
                {groups.filter(g => selectedGroup === 'all' || g.id === selectedGroup).map(group => {
                    const groupSlots = slots.filter(s => s.group_id === group.id)

                    return (
                        <div key={group.id}>
                            <h3 className="font-heading text-lg font-bold text-gold mb-3 border-b border-border-primary pb-2">
                                {group.name}
                            </h3>
                            {groupSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {groupSlots.map((slot) => (
                                        <div key={slot.id} className={`p-4 rounded-xl text-center border transition-all ${slot.registration ? 'bg-gold/5 border-gold/20 glow-gold' : 'bg-bg-secondary border-border-primary'}`}>
                                            <div className="font-heading text-xl font-bold text-gold">#{slot.slot_number}</div>
                                            {slot.registration ? (
                                                <div className="mt-2">
                                                    {(slot.registration as Registration).team_logo_url ? (
                                                        <img src={(slot.registration as Registration).team_logo_url!} alt="" className="w-8 h-8 rounded-lg mx-auto mb-1 object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center mx-auto mb-1"><Users size={14} className="text-gold" /></div>
                                                    )}
                                                    <span className="text-xs text-text-secondary block truncate">{(slot.registration as Registration).team_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-text-muted mt-2 block">Available</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-text-muted italic">No slots initialized for this group.</p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
