import Link from 'next/link'
import { Trophy, Users, Zap, ChevronRight, Gamepad2, Shield, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDatePKT, isTournamentLive } from '@/lib/utils'
import type { Tournament } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let tournaments: Tournament[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6)
    tournaments = (data || []) as Tournament[]
  } catch {
    // Supabase not configured yet
  }

  const liveTournaments = tournaments.filter(t => isTournamentLive(t.match_start, t.match_end))

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(212,175,55,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(220,38,38,0.08) 0%, transparent 50%)',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {liveTournaments.length > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {liveTournaments.length} Tournament{liveTournaments.length > 1 ? 's' : ''} Live Now
              </div>
            )}

            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              DOMINATE THE
              <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                BATTLEFIELD
              </span>
            </h1>

            <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Pakistan&apos;s premier esports tournament platform. Register your squad, prove your skills, and compete for glory in PUBG Mobile.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/tournaments" className="btn-gold px-8 py-3 text-base">
                Browse Tournaments
              </Link>
              <Link href="/about" className="btn-outline px-8 py-3 text-base">
                Learn More
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Trophy, label: 'Tournaments', value: tournaments.length || '0' },
              { icon: Users, label: 'Teams', value: '100+' },
              { icon: Gamepad2, label: 'Games', value: '2' },
              { icon: Star, label: 'Prize Pool', value: 'PKR 50K+' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <stat.icon size={20} className="text-gold mx-auto mb-2" />
                <div className="font-heading text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Socials */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="https://discord.gg/SZpKph7Wbp" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-8 py-4 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 hover:border-[#5865F2] rounded-2xl transition-all duration-300">
              <div className="p-3 bg-[#5865F2] rounded-xl text-white group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h.01" /><path d="M15 12h.01" /><path d="M7.5 22h9c2.485 0 4.5-2.015 4.5-4.5v-10c0-2.485-2.015-4.5-4.5-4.5h-9c-2.485 0-4.5 2.015-4.5 4.5v10c0 2.485 2.015 4.5 4.5 4.5Z" /><path d="M6 8l4 3" /><path d="M18 8l-4 3" /></svg>
              </div>
              <div className="text-left">
                <div className="text-[#5865F2] font-bold uppercase text-xs tracking-wider mb-0.5">Join Community</div>
                <div className="font-heading font-bold text-xl text-white">Discord Server</div>
              </div>
            </a>

            <a href="https://instagram.com/zenithesports.pk" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-8 py-4 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/20 hover:border-[#E1306C] rounded-2xl transition-all duration-300">
              <div className="p-3 bg-[#E1306C] rounded-xl text-white group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </div>
              <div className="text-left">
                <div className="text-[#E1306C] font-bold uppercase text-xs tracking-wider mb-0.5">Follow Us</div>
                <div className="font-heading font-bold text-xl text-white">Instagram</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="section-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">
                Featured <span className="text-gold">Tournaments</span>
              </h2>
              <p className="text-text-muted text-sm mt-1">Compete in the latest PUBG Mobile tournaments</p>
            </div>
            <Link href="/tournaments" className="hidden sm:flex items-center gap-1 text-sm text-gold hover:text-gold-light transition-colors">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {tournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => {
                const isLive = isTournamentLive(tournament.match_start, tournament.match_end)
                return (
                  <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group">
                    <div className="glass-card overflow-hidden hover:border-gold/30 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-lg group-hover:shadow-gold/5">
                      {/* Poster */}
                      <div className="relative aspect-video bg-bg-tertiary overflow-hidden">
                        {tournament.poster_url ? (
                          <img src={tournament.poster_url} alt={tournament.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-card">
                            <Trophy size={40} className="text-gold/30" />
                          </div>
                        )}
                        {isLive && (
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-xs font-bold uppercase">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </div>
                        )}
                        {tournament.prize_pool && (
                          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-gold text-xs font-bold">
                            {tournament.prize_pool}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-heading text-lg font-bold text-text-primary group-hover:text-gold transition-colors line-clamp-1">
                            {tournament.name}
                          </h3>
                          {tournament.logo_url && (
                            <img src={tournament.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Shield size={12} className="text-gold/60" />
                            {tournament.server_region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} className="text-gold/60" />
                            {tournament.total_team_capacity} Teams
                          </span>
                        </div>

                        {tournament.registration_end && (
                          <div className="mt-3 pt-3 border-t border-border-primary">
                            <p className="text-xs text-text-muted">
                              Reg. closes: <span className="text-text-secondary">{formatDatePKT(tournament.registration_end)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Trophy size={48} className="text-gold/20 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-text-secondary mb-2">No Tournaments Yet</h3>
              <p className="text-text-muted text-sm">Stay tuned — new tournaments will be announced soon!</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/tournaments" className="btn-outline text-xs">
              View All Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
              Why <span className="text-gold">Zenith</span>?
            </h2>
            <p className="text-text-muted text-sm max-w-lg mx-auto">Built for competitive gamers who demand the best</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Automated System',
                description: 'Fair and instant slot assignment. No favoritism, no delays — first approved, first served.',
              },
              {
                icon: Shield,
                title: 'Verified Teams',
                description: 'Every team goes through verification. Only legitimate players compete in our tournaments.',
              },
              {
                icon: Trophy,
                title: 'Premium Tournaments',
                description: 'Professional tournament management with prize pools, live schedules, and real-time updates.',
              },
            ].map((feature, i) => (
              <div key={i} className="glass-card-gold p-6 text-center hover:border-gold/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={24} className="text-gold" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl md:text-4xl font-bold mb-4">
            Ready to <span className="text-gold">Compete</span>?
          </h2>
          <p className="text-text-secondary text-base mb-8 max-w-lg mx-auto">
            Join thousands of players across Pakistan. Register your team and start your journey to the top.
          </p>
          <Link href="/tournaments" className="btn-gold px-8 py-3 text-base">
            Join a Tournament
          </Link>
        </div>
      </section>
    </div>
  )
}
