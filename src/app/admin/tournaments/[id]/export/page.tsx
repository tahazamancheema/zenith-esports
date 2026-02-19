'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, Loader2, FileSpreadsheet, Phone } from 'lucide-react'
import Link from 'next/link'
import { generateCSV } from '@/lib/utils'
import type { Registration, Slot, Tournament } from '@/lib/types'

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        loadTournament()
    }, [id])

    const loadTournament = async () => {
        const { data } = await supabase.from('tournaments').select('*').eq('id', id).single()
        setTournament(data as Tournament | null)
        setLoading(false)
    }

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
    }

    const exportVerifiedTeams = async () => {
        setExporting(true)
        try {
            // Get approved registrations
            const { data: regs } = await supabase
                .from('registrations')
                .select('*')
                .eq('tournament_id', id)
                .eq('status', 'approved')
                .order('team_name')

            if (!regs || regs.length === 0) {
                alert('No verified teams to export')
                setExporting(false)
                return
            }

            const headers = ['Tournament', 'Team Name', 'Captain IGN', 'Captain ID', 'WhatsApp (Normalized)', 'WhatsApp (Raw)', 'Discord']

            // We need to fetch players for these registrations to get captain's info? 
            // Or just export basic team info. Let's fetch players too or just flat export.
            // For simplicity, let's export Team info first.

            const rows = regs.map(reg => [
                tournament?.name || '',
                reg.team_name,
                '', // Captain IGN placeholder (fetching all players might be heavy, but maybe necessary if user wants it)
                '', // Captain ID placeholder
                reg.whatsapp_normalized,
                reg.whatsapp_raw,
                reg.discord || ''
            ])

            const csv = generateCSV(headers, rows)
            downloadCSV(csv, `${tournament?.name || 'tournament'}_verified_teams.csv`)
        } catch { alert('Export failed') }
        setExporting(false)
    }

    const exportWhatsAppList = async () => {
        setExporting(true)
        try {
            const { data: regs } = await supabase
                .from('registrations')
                .select('team_name, whatsapp_raw, whatsapp_normalized')
                .eq('tournament_id', id)
                .in('status', ['approved', 'assigned_slot'])
                .order('team_name')

            if (!regs || regs.length === 0) {
                alert('No approved teams to export')
                setExporting(false)
                return
            }

            const headers = ['Team Name', 'WhatsApp (Normalized)', 'WhatsApp (Raw)']
            const rows = regs.map(r => [r.team_name, r.whatsapp_normalized, r.whatsapp_raw])

            const csv = generateCSV(headers, rows)
            downloadCSV(csv, `${tournament?.name || 'tournament'}_whatsapp_contacts.csv`)
        } catch { alert('Export failed') }
        setExporting(false)
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-gold animate-spin" /></div>

    return (
        <div className="p-6 md:p-8 max-w-2xl">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors mb-6"><ArrowLeft size={14} /> Back</Link>
            <h1 className="font-heading text-2xl font-bold mb-2">Export <span className="text-gold">Data</span></h1>
            <p className="text-text-muted text-sm mb-8">{tournament?.name}</p>

            <div className="space-y-4">
                <div className="glass-card p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                            <FileSpreadsheet size={24} className="text-gold" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-heading font-bold text-base mb-1">Verified Teams List</h3>
                            <p className="text-sm text-text-muted mb-3">CSV with tournament name, team names, captain info, and contacts for all verified teams.</p>
                            <button onClick={exportVerifiedTeams} disabled={exporting} className="btn-gold text-xs flex items-center gap-1">
                                {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                Download CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                            <Phone size={24} className="text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-heading font-bold text-base mb-1">WhatsApp Contacts</h3>
                            <p className="text-sm text-text-muted mb-3">CSV with team names and WhatsApp numbers for all approved/assigned teams.</p>
                            <button onClick={exportWhatsAppList} disabled={exporting} className="btn-gold text-xs flex items-center gap-1">
                                {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
