import { Swords, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ScrimsPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 hero-gradient">
            <div className="text-center max-w-lg">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-gold-dark/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                    <Swords size={40} className="text-gold" />
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
                    <span className="text-gold">SCRIMS</span>
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider mb-6">
                    <Clock size={14} />
                    Coming Soon
                </div>
                <p className="text-text-secondary mb-8">
                    Practice scrims with organized scheduling and team matching. Coming to Zenith Esports soon!
                </p>
                <Link href="/" className="btn-outline">
                    Back to Home
                </Link>
            </div>
        </div>
    )
}
