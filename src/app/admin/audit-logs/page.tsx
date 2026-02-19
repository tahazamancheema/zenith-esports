import { createClient } from '@/lib/supabase/server'
import { formatDatePKT } from '@/lib/utils'
import { FileText } from 'lucide-react'
import type { AuditLog } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
    let logs: AuditLog[] = []

    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('audit_logs')
            .select('*, user:users(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(100)
        logs = (data || []) as AuditLog[]
    } catch {
        // not configured
    }

    const getActionColor = (action: string) => {
        if (action.includes('approve')) return 'text-green-400 bg-green-400/10'
        if (action.includes('reject')) return 'text-red-400 bg-red-400/10'
        if (action.includes('create')) return 'text-blue-400 bg-blue-400/10'
        if (action.includes('move') || action.includes('slot')) return 'text-amber-400 bg-amber-400/10'
        if (action.includes('role')) return 'text-purple-400 bg-purple-400/10'
        return 'text-text-secondary bg-bg-tertiary'
    }

    return (
        <div className="p-6 md:p-8">
            <h1 className="font-heading text-2xl font-bold mb-6">Audit <span className="text-gold">Logs</span></h1>

            {logs.length > 0 ? (
                <div className="space-y-2">
                    {logs.map((log) => (
                        <div key={log.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-text-muted">{log.entity_type}</span>
                                </div>
                                <div className="text-xs text-text-muted mt-1">
                                    by {(log.user as unknown as { full_name: string; email: string })?.full_name || (log.user as unknown as { email: string })?.email || 'System'}
                                    {log.details && Object.keys(log.details).length > 0 && (
                                        <span className="ml-2 text-text-secondary">
                                            {JSON.stringify(log.details).substring(0, 100)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-text-muted whitespace-nowrap">{formatDatePKT(log.created_at)}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <FileText size={48} className="text-gold/20 mx-auto mb-4" />
                    <h3 className="font-heading text-xl font-bold text-text-secondary mb-2">No Logs Yet</h3>
                    <p className="text-text-muted text-sm">Audit logs will appear here when admin/moderator actions are performed</p>
                </div>
            )}
        </div>
    )
}
