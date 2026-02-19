import { Trophy, Calendar, MapPin, Users, Shield } from 'lucide-react'

export default function Loading() {
    return (
        <div className="w-full">
            {/* Hero Skeleton */}
            <div className="relative aspect-[3/1] md:aspect-[4/1] bg-bg-tertiary animate-pulse">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-end gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/5 animate-pulse" />
                        <div className="space-y-2 mb-1">
                            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                            <div className="h-8 w-64 md:w-96 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Info Cards Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass-card p-4 flex flex-col items-center justify-center gap-2 h-24">
                            <div className="w-8 h-8 rounded-full bg-bg-tertiary animate-pulse" />
                            <div className="h-4 w-20 bg-bg-tertiary rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="glass-card p-6 h-48 animate-pulse bg-bg-tertiary/20" />

                        {/* Roadmap */}
                        <div className="glass-card p-6 h-64 animate-pulse bg-bg-tertiary/20" />
                    </div>

                    <div className="space-y-8">
                        {/* Schedule */}
                        <div className="glass-card p-6 h-64 animate-pulse bg-bg-tertiary/20" />

                        {/* Teams */}
                        <div className="glass-card p-6 h-48 animate-pulse bg-bg-tertiary/20" />
                    </div>
                </div>
            </div>
        </div>
    )
}
