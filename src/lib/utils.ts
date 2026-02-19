/**
 * Normalize WhatsApp number:
 * - Remove spaces, dashes, parentheses
 * - Ensure starts with + and country code
 * - Store both raw and normalized
 */
export function normalizeWhatsApp(raw: string): string {
    // Remove all non-digit characters except +
    let normalized = raw.replace(/[^\d+]/g, '')

    // If starts with 0, assume Pakistan (+92)
    if (normalized.startsWith('0')) {
        normalized = '+92' + normalized.slice(1)
    }

    // If doesn't start with +, add it
    if (!normalized.startsWith('+')) {
        normalized = '+' + normalized
    }

    return normalized
}

/**
 * Format date for Pakistan Standard Time display
 */
export function formatDatePKT(dateStr: string | null | undefined): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Check if tournament is currently live
 */
export function isTournamentLive(matchStart: string | null, matchEnd: string | null): boolean {
    if (!matchStart || !matchEnd) return false
    const now = new Date()
    return now >= new Date(matchStart) && now <= new Date(matchEnd)
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(regStart: string | null, regEnd: string | null): boolean {
    if (!regStart || !regEnd) return false
    const now = new Date()
    return now >= new Date(regStart) && now <= new Date(regEnd)
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'assigned_slot': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        case 'live': return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'upcoming': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
}

/**
 * Generate CSV from data
 */
export function generateCSV(headers: string[], rows: string[][]): string {
    const headerLine = headers.map(h => `"${h}"`).join(',')
    const dataLines = rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    return [headerLine, ...dataLines].join('\n')
}
