'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Trophy, Users, FileText, Shield } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const sidebarLinks = [
        { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
        { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ]

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href
        return pathname.startsWith(href)
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Sidebar - desktop */}
            <aside className="hidden lg:flex flex-col w-60 border-r border-border-primary bg-bg-secondary shrink-0">
                <div className="p-4 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-gold" />
                        <span className="font-heading font-bold text-sm uppercase tracking-wider text-gold">Admin Panel</span>
                    </div>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href, link.exact)
                                    ? 'bg-gold/10 text-gold'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                                }`}
                        >
                            <link.icon size={16} />
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Mobile nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-primary bg-bg-secondary/95 backdrop-blur-xl">
                <div className="flex items-center justify-around py-2">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive(link.href, link.exact) ? 'text-gold' : 'text-text-muted'
                                }`}
                        >
                            <link.icon size={18} />
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-16 lg:pb-0">
                {children}
            </div>
        </div>
    )
}
