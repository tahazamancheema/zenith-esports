import { Shield, Target, Users, Award } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {/* Hero */}
            <div className="text-center mb-12">
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <img src="/logo.png" alt="Zenith Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">
                    About <span className="text-gold">Zenith Esports</span>
                </h1>
                <p className="text-text-secondary text-base max-w-2xl mx-auto">
                    Pakistan&apos;s premier esports tournament platform — built by gamers, for gamers. We bring fair, professional competitive gaming to the masses.
                </p>
            </div>

            {/* Mission */}
            <div className="glass-card-gold p-8 mb-10">
                <h2 className="font-heading text-xl font-bold text-gold mb-3">Our Mission</h2>
                <p className="text-text-secondary leading-relaxed">
                    Zenith Esports is on a mission to professionalize the competitive gaming scene in Pakistan.
                    We provide a platform where teams can compete in organized, fair, and transparent tournaments.
                    Our automated systems ensure equal opportunity — from registration verification to slot assignment —
                    so that talent, not connections, determines your place in the competition.
                </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {[
                    { icon: Shield, title: 'Fair Play', desc: 'Every team is verified. Every slot is earned. No shortcuts, no favoritism.' },
                    { icon: Target, title: 'Transparency', desc: 'All tournament details, schedules, and results are publicly visible. No hidden agendas.' },
                    { icon: Users, title: 'Community First', desc: 'We listen to our community. Every feature exists because players asked for it.' },
                    { icon: Award, title: 'Excellence', desc: 'Premium tournament experiences with professional-grade management and communication.' },
                ].map((v, i) => (
                    <div key={i} className="glass-card p-6 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                            <v.icon size={20} className="text-gold" />
                        </div>
                        <div>
                            <h3 className="font-heading text-base font-bold mb-1">{v.title}</h3>
                            <p className="text-sm text-text-muted">{v.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Games */}
            <div className="glass-card p-8">
                <h2 className="font-heading text-xl font-bold text-gold mb-4">Supported Games</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-bg-secondary border border-gold/20">
                        <h3 className="font-heading font-bold text-lg mb-1">PUBG Mobile</h3>
                        <p className="text-sm text-text-muted">Full tournament support — registration, verification, slot assignment, and exports.</p>
                        <span className="inline-block mt-2 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="p-4 rounded-lg bg-bg-secondary border border-border-primary">
                        <h3 className="font-heading font-bold text-lg mb-1">Valorant</h3>
                        <p className="text-sm text-text-muted">Coming soon — tournament features are under development.</p>
                        <span className="inline-block mt-2 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
