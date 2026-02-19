export type UserRole = 'admin' | 'moderator' | 'user'

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'assigned_slot'

export type TournamentStatus = 'upcoming' | 'registration_open' | 'registration_closed' | 'live' | 'completed'

export type FieldType = 'text' | 'number' | 'dropdown' | 'file' | 'textarea'

export type UploadType = 'verification' | 'payment_proof' | 'team_logo'

export interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: UserRole
    created_at: string
    updated_at: string
}

export interface Tournament {
    id: string
    name: string
    game: string
    description: string | null
    prize_pool: string | null
    server_region: string
    poster_url: string | null
    logo_url: string | null
    registration_start: string | null
    registration_end: string | null
    match_start: string | null
    match_end: string | null
    total_team_capacity: number
    teams_per_group: number
    max_players_per_team: number
    is_paid: boolean
    is_published: boolean
    status: TournamentStatus
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface TournamentStage {
    id: string
    tournament_id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    sort_order: number
    created_at: string
}

export interface TournamentSchedule {
    id: string
    tournament_id: string
    title: string
    description: string | null
    match_date: string
    sort_order: number
    created_at: string
}

export interface TournamentGroup {
    id: string
    tournament_id: string
    name: string
    sort_order: number
    created_at: string
}

export interface RegistrationFormConfig {
    id: string
    tournament_id: string
    field_name: string
    field_label: string
    field_type: FieldType
    is_required: boolean
    is_enabled: boolean
    options: string[] | null
    sort_order: number
    section: 'team' | 'player' | 'verification' | 'custom'
    created_at: string
}

export interface Registration {
    id: string
    tournament_id: string
    user_id: string
    team_name: string
    team_logo_url: string | null
    whatsapp_raw: string
    whatsapp_normalized: string
    discord: string | null
    status: RegistrationStatus
    group_id: string | null
    custom_fields: Record<string, unknown>
    created_at: string
    updated_at: string
    // Joined fields
    players?: Player[]
    uploads?: Upload[]
    slot?: Slot
    tournament?: Tournament
    user?: User
}

export interface Player {
    id: string
    registration_id: string
    ign: string
    character_id: string
    discord: string | null
    is_captain: boolean
    sort_order: number
    created_at: string
}

export interface Slot {
    id: string
    tournament_id: string
    registration_id: string | null
    slot_number: number
    assigned_at: string
    assigned_by: string | null
    // Joined
    registration?: Registration
}

export interface Upload {
    id: string
    registration_id: string
    upload_type: UploadType
    field_name: string | null
    file_url: string
    file_name: string | null
    created_at: string
}

export interface AuditLog {
    id: string
    user_id: string | null
    action: string
    entity_type: string
    entity_id: string | null
    details: Record<string, unknown>
    created_at: string
    user?: User
}

export interface ContactSubmission {
    id: string
    name: string
    email: string
    subject: string | null
    message: string
    is_read: boolean
    created_at: string
}
