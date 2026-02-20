'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Chrome, ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const supabase = createClient()
    const searchParams = useSearchParams()

    useEffect(() => {
        const errorParam = searchParams.get('error')
        const messageParam = searchParams.get('message')
        if (errorParam) {
            setError(messageParam || 'Authentication failed. Please try again.')
        }
    }, [searchParams])

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        setError('')
        setMessage('')

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Check your email for a magic link to sign in!')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 hero-gradient">
            <div className="w-full max-w-md">
                <div className="glass-card-gold p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <Image src="/logo.png" alt="Zenith Logo" fill className="object-contain" />
                        </div>
                        <h1 className="font-heading text-2xl font-bold">Welcome Back</h1>
                        <p className="text-text-muted text-sm mt-1">Sign in to manage your tournaments and teams</p>
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 mb-6"
                    >
                        <Chrome size={18} />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-border-primary" />
                        <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-border-primary" />
                    </div>

                    {/* Email Magic Link */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="input-field pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="btn-gold w-full flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                            Send Magic Link
                        </button>
                    </form>

                    {/* Messages */}
                    {message && (
                        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Back */}
                    <div className="mt-6 text-center">
                        <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold transition-colors">
                            <ArrowLeft size={14} /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoginPageContent() {
    return <LoginPage />
}

import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gold" /></div>}>
            <LoginPage />
        </Suspense>
    )
}
