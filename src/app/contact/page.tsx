'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Mail, User, MessageSquare, Loader2, CheckCircle } from 'lucide-react'

export default function ContactPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            const { error } = await supabase.from('contact_submissions').insert({
                name,
                email,
                subject: subject || null,
                message,
            })

            if (error) throw error
            setSuccess(true)
        } catch {
            setError('Failed to submit. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h1 className="font-heading text-2xl font-bold mb-2">Message Sent!</h1>
                <p className="text-text-muted">We&apos;ll get back to you as soon as possible.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <div className="text-center mb-10">
                <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
                    Get In <span className="text-gold">Touch</span>
                </h1>
                <p className="text-text-muted">Have a question or feedback? We&apos;d love to hear from you.</p>
            </div>

            <div className="glass-card-gold p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Name *</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-10" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1.5">Email *</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" required />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-1.5">Subject</label>
                        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-1.5">Message *</label>
                        <div className="relative">
                            <MessageSquare size={16} className="absolute left-3 top-3 text-text-muted" />
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field pl-10 min-h-[120px] resize-y" required />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
                    )}

                    <button type="submit" disabled={submitting} className="btn-gold w-full py-3 flex items-center justify-center gap-2">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    )
}
