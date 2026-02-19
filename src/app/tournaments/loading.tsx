import { Trophy } from 'lucide-react'

export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="mb-10">
                <div className="h-10 w-64 bg-bg-tertiary rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-96 bg-bg-tertiary rounded-lg animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass-card overflow-hidden h-[300px] border border-border-primary/50">
                        <div className="aspect-video bg-bg-tertiary animate-pulse flex items-center justify-center">
                            <Trophy size={32} className="text-white/5" />
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="h-6 w-3/4 bg-bg-tertiary rounded animate-pulse" />
                            <div className="flex gap-3">
                                <div className="h-4 w-20 bg-bg-tertiary rounded animate-pulse" />
                                <div className="h-4 w-20 bg-bg-tertiary rounded animate-pulse" />
                            </div>
                            <div className="mt-4 pt-3 border-t border-border-primary/50">
                                <div className="h-3 w-1/2 bg-bg-tertiary rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
