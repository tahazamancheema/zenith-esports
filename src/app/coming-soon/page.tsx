import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ComingSoonPage() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
            <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4">
                VALORANT <span className="text-gold">COMING SOON</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-xl mb-8">
                We are working hard to bring Valorant tournaments to Zenith Esports.
                Stay tuned for updates and get ready to climb the ranks properly.
            </p>
            <Link
                href="/"
                className="btn-gold flex items-center gap-2"
            >
                <ArrowLeft size={18} /> Back to Home
            </Link>
        </div>
    )
}
