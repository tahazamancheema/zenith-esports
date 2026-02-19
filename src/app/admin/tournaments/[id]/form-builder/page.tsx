'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react'
import Link from 'next/link'
import type { RegistrationFormConfig } from '@/lib/types'

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const [fields, setFields] = useState<Partial<RegistrationFormConfig>[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => { loadFields() }, [id])

    const loadFields = async () => {
        const { data } = await supabase
            .from('registration_form_config')
            .select('*')
            .eq('tournament_id', id)
            .order('sort_order')
        setFields((data || []) as Partial<RegistrationFormConfig>[])
        setLoading(false)
    }

    const addField = () => {
        setFields([...fields, {
            field_name: `custom_${Date.now()}`,
            field_label: '',
            field_type: 'text',
            is_required: false,
            is_enabled: true,
            options: null,
            sort_order: fields.length,
            section: 'custom',
        }])
    }

    const addVerificationField = () => {
        setFields([...fields, {
            field_name: `verification_${Date.now()}`,
            field_label: '',
            field_type: 'file',
            is_required: false,
            is_enabled: true,
            options: null,
            sort_order: fields.length,
            section: 'verification',
        }])
    }

    const updateField = (index: number, updates: Partial<RegistrationFormConfig>) => {
        const updated = [...fields]
        updated[index] = { ...updated[index], ...updates }
        setFields(updated)
    }

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage('')
        try {
            // Delete all existing and re-insert
            await supabase.from('registration_form_config').delete().eq('tournament_id', id)

            if (fields.length > 0) {
                const { error } = await supabase.from('registration_form_config').insert(
                    fields.map((f, i) => ({
                        tournament_id: id,
                        field_name: f.field_name || `field_${i}`,
                        field_label: f.field_label || 'Untitled',
                        field_type: f.field_type || 'text',
                        is_required: f.is_required || false,
                        is_enabled: f.is_enabled !== false,
                        options: f.options || null,
                        sort_order: i,
                        section: f.section || 'custom',
                    }))
                )
                if (error) throw error
            }

            setMessage('Form configuration saved!')
        } catch {
            setMessage('Failed to save')
        }
        setSaving(false)
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-gold animate-spin" /></div>

    return (
        <div className="p-6 md:p-8 max-w-3xl">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6"><ArrowLeft size={14} /> Back</Link>
            <h1 className="font-heading text-2xl font-bold mb-2">Registration <span className="text-gold">Form Builder</span></h1>
            <p className="text-text-muted text-sm mb-6">Configure custom fields for team registration</p>

            <div className="space-y-3 mb-6">
                {fields.map((field, i) => (
                    <div key={i} className="glass-card p-4">
                        <div className="flex items-start gap-3">
                            <GripVertical size={16} className="text-text-muted mt-2.5 shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Label</label>
                                        <input type="text" value={field.field_label || ''} onChange={(e) => updateField(i, { field_label: e.target.value })} className="input-field text-sm" placeholder="Field label" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Type</label>
                                        <select value={field.field_type || 'text'} onChange={(e) => updateField(i, { field_type: e.target.value as RegistrationFormConfig['field_type'] })} className="input-field text-sm">
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="textarea">Textarea</option>
                                            <option value="dropdown">Dropdown</option>
                                            <option value="file">File Upload</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Section</label>
                                        <select value={field.section || 'custom'} onChange={(e) => updateField(i, { section: e.target.value as RegistrationFormConfig['section'] })} className="input-field text-sm">
                                            <option value="custom">Custom</option>
                                            <option value="verification">Verification</option>
                                            <option value="team">Team</option>
                                            <option value="player">Player</option>
                                        </select>
                                    </div>
                                </div>

                                {field.field_type === 'dropdown' && (
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Options (comma-separated)</label>
                                        <input type="text" value={(field.options || []).join(', ')} onChange={(e) => updateField(i, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })} className="input-field text-sm" placeholder="Option 1, Option 2, Option 3" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={field.is_required || false} onChange={(e) => updateField(i, { is_required: e.target.checked })} className="w-3.5 h-3.5 accent-gold" />
                                        <span className="text-xs text-text-secondary">Required</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={field.is_enabled !== false} onChange={(e) => updateField(i, { is_enabled: e.target.checked })} className="w-3.5 h-3.5 accent-gold" />
                                        <span className="text-xs text-text-secondary">Enabled</span>
                                    </label>
                                </div>
                            </div>
                            <button onClick={() => removeField(i)} className="text-red-400 hover:text-red-300 mt-2"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={addField} className="btn-outline text-xs flex items-center gap-1"><Plus size={12} /> Add Custom Field</button>
                <button onClick={addVerificationField} className="btn-outline text-xs flex items-center gap-1"><Plus size={12} /> Add Verification Upload</button>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes('saved') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                    {message}
                </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-gold flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Configuration
            </button>
        </div>
    )
}
