import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t border-border-primary bg-bg-secondary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="relative w-8 h-8">
                                <Image src="/logo.png" alt="Zenith Logo" fill className="object-contain" />
                            </div>
                            <span className="font-heading font-bold text-lg tracking-wider">
                                ZENITH<span className="text-gold">ESPORTS</span>
                            </span>
                        </Link>
                        <p className="text-text-muted text-sm leading-relaxed mb-4">
                            Pakistan&apos;s premier esports tournament platform. Compete, conquer, and rise to the top.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://discord.gg/SZpKph7Wbp" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-muted hover:text-gold hover:bg-gold/10 transition-colors">
                                <span className="sr-only">Discord</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h.01" /><path d="M15 12h.01" /><path d="M7.5 22h9c2.485 0 4.5-2.015 4.5-4.5v-10c0-2.485-2.015-4.5-4.5-4.5h-9c-2.485 0-4.5 2.015-4.5 4.5v10c0 2.485 2.015 4.5 4.5 4.5Z" /><path d="M6 8l4 3" /><path d="M18 8l-4 3" /></svg>
                            </a>
                            <a href="https://wa.me/923390715753" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-muted hover:text-gold hover:bg-gold/10 transition-colors">
                                <span className="sr-only">WhatsApp</span>
                                <Phone size={18} />
                            </a>
                            <a href="https://instagram.com/zenithesports.pk" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-muted hover:text-gold hover:bg-gold/10 transition-colors">
                                <span className="sr-only">Instagram</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-gold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            {[
                                { href: '/tournaments', label: 'Tournaments' },
                                { href: '/about', label: 'About Us' },
                                { href: '/contact', label: 'Contact' },

                                { href: '/scrims', label: 'Scrims' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-text-muted hover:text-gold transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Games */}
                    <div>
                        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-gold mb-4">Games</h4>
                        <ul className="space-y-2">
                            <li className="text-sm text-text-secondary">PUBG Mobile</li>
                            <li className="text-sm text-text-secondary">Valorant</li>

                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-gold mb-4">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-text-muted">
                                <Mail size={14} className="text-gold" />
                                zenithesportsmgmt@gmail.com
                            </li>
                            <li className="flex items-center gap-2 text-sm text-text-muted">
                                <Phone size={14} className="text-gold" />
                                +92 339 071 5753
                            </li>
                            <li className="flex items-center gap-2 text-sm text-text-muted">
                                <MapPin size={14} className="text-gold" />
                                Pakistan
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-border-primary flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-text-muted">
                        &copy; {new Date().getFullYear()} Zenith Esports. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                        <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
