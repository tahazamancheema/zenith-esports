'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, ChevronDown, LogOut, User, Shield, LayoutDashboard } from 'lucide-react'
import type { User as UserType } from '@/lib/types'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState<UserType | null>(null)
    const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const fetchOrCreateProfile = async (au: { id: string; email?: string; user_metadata?: Record<string, any> }) => {
        // Try to fetch existing profile
        const { data: profile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', au.id)
            .maybeSingle()

        if (profile) return profile

        // If no profile exists, try to create one
        console.log('No profile found, attempting to create...')

        const updates = {
            id: au.id,
            email: au.email || '',
            full_name: au.user_metadata?.full_name || au.user_metadata?.name || au.email?.split('@')[0] || 'User',
            role: 'user', // Default role
        }

        const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .upsert(updates, { onConflict: 'id' })
            .select()
            .single()

        if (newProfile) return newProfile

        console.error('Profile creation failed:', insertError?.message)

        // Fallback: Return a temporary profile object so UI doesn't crash, 
        // but don't grant admin privileges based on email here. 
        // Admin rights must come from the DB.
        return {
            id: au.id,
            role: 'user',
            email: au.email,
            full_name: updates.full_name
        }
    }

    useEffect(() => {
        const getUser = async () => {
            const { data: { user: au } } = await supabase.auth.getUser()
            if (au) {
                console.log('Navbar: Auth User found', au.id)
                setAuthUser(au)
                // Add retry logic for profile fetch
                let attempts = 0
                const maxAttempts = 3

                while (attempts < maxAttempts) {
                    const profile = await fetchOrCreateProfile(au)
                    console.log(`Navbar: Profile attempt ${attempts + 1}`, profile)
                    if (profile) {
                        setUser(profile as UserType)
                        break
                    }
                    attempts++
                    await new Promise(r => setTimeout(r, 500)) // Wait 500ms before retry
                }
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setAuthUser(session.user)
                const profile = await fetchOrCreateProfile(session.user)
                if (profile) setUser(profile)
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setAuthUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])



    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setAuthUser(null)
            router.refresh()
            router.push('/')
        } catch (error) {
            console.error('Sign out error:', error)
            // Force cleanup even if API fails
            setUser(null)
            setAuthUser(null)
            window.location.href = '/'
        }
    }

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/tournaments', label: 'Tournaments' },
        { href: '/scrims', label: 'Scrims' },
        { href: '/coming-soon', label: 'Valorant' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
    ]
    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-primary" style={{ background: 'rgba(10, 10, 15, 0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-14 h-14 md:w-16 md:h-16">
                            <Image src="/logo.png" alt="Zenith Logo" fill className="object-contain" />
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.href)
                                    ? 'text-gold bg-gold/10'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {/* Show Admin Panel for admins */}
                        {(user?.role === 'admin' || user?.role === 'moderator' || authUser?.email === 'zenithesports@gmail.com') && (
                            <Link
                                href="/admin"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/admin')
                                    ? 'text-gold bg-gold/10'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                                    }`}
                            >
                                <LayoutDashboard size={16} className="inline mr-1 -mt-0.5" />
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    {/* Auth / User Menu */}
                    <div className="hidden md:flex items-center gap-3">
                        {authUser ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-bg-tertiary transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold">
                                        {(user?.full_name?.[0] || authUser.email?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <span className="text-text-secondary text-sm max-w-[120px] truncate">
                                        {user?.full_name || authUser.email}
                                    </span>
                                    <ChevronDown size={14} className="text-text-muted" />
                                </button>

                                {showUserMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border-primary bg-bg-card shadow-xl z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-border-primary">
                                                <p className="text-sm font-medium text-text-primary">{user?.full_name || 'User'}</p>
                                                <p className="text-xs text-text-muted truncate">{authUser.email}</p>
                                                {user?.role && user.role !== 'user' && (
                                                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-gold">
                                                        <Shield size={10} />
                                                        {user.role.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                                                >
                                                    <LayoutDashboard size={14} /> Dashboard
                                                </Link>
                                                {(user?.role === 'admin' || user?.role === 'moderator' || authUser?.email === 'zenithesports@gmail.com') && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                                                    >
                                                        <Shield size={14} /> Admin Panel
                                                    </Link>
                                                )}
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                                                >
                                                    <User size={14} /> Profile
                                                </Link>
                                            </div>
                                            <div className="py-1 border-t border-border-primary">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <LogOut size={14} /> Sign out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="btn-gold text-xs">
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        {isOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-border-primary bg-bg-secondary/95 backdrop-blur-xl">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                                    ? 'text-gold bg-gold/10'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-3 border-t border-border-primary mt-3">
                            {authUser ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                                    >
                                        Dashboard
                                    </Link>
                                    {(user?.role === 'admin' || user?.role === 'moderator' || authUser?.email === 'zenithesports@gmail.com') && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-3 py-2.5 rounded-lg text-sm text-gold hover:bg-gold/10"
                                        >
                                            Admin Panel
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full text-center btn-gold text-xs"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
