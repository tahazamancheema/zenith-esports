import { Crosshair, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ValorantPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 hero-gradient">
            <div className="text-center max-w-lg">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                    <Crosshair size={40} className="text-red-400" />
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
                    <span className="text-accent-red">VALORANT</span>
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider mb-6">
                    <Clock size={14} />
                    Coming Soon
                </div>
                <p className="text-text-secondary mb-8">
                    Valorant tournaments are coming to Zenith Esports! Stay tuned for competitive Valorant events with professional tournament management.
                </p>
                <Link href="/" className="btn-outline">
                    Back to Home
                </Link>
            </div>
        </div>
    )
}
