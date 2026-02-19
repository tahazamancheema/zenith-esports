import { FileText, UserCheck, AlertTriangle, Gavel } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                    Terms of <span className="text-gold">Service</span>
                </h1>
                <p className="text-text-secondary text-sm">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-8">
                {/* Introduction */}
                <div className="glass-card p-8">
                    <p className="text-text-secondary leading-relaxed">
                        Welcome to Zenith Esports. By accessing or using our platform, you agree to be bound by these Terms of Service.
                        If you disagree with any part of the terms, you may not access the service.
                    </p>
                </div>

                {/* Key Rules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <UserCheck size={20} />
                            </div>
                            <h2 className="font-heading text-lg font-bold">Eligibility</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            You must be at least 13 years old to use this service. By registering, you warrant that all information provided is accurate and truthful.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <AlertTriangle size={20} />
                            </div>
                            <h2 className="font-heading text-lg font-bold">Fair Play</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Cheating, hacking, exploiting bugs, or any form of unsportsmanlike conduct is strictly prohibited and will result in an immediate ban.
                        </p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="glass-card p-8 space-y-8">
                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">1. Accounts</h2>
                        <ul className="list-disc pl-5 space-y-2 text-text-secondary text-sm">
                            <li>You are responsible for maintaining the confidentiality of your account and password.</li>
                            <li>You agree to accept responsibility for all activities that occur under your account.</li>
                            <li>We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">2. Tournament Rules</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            All participants must adhere to the specific rules laid out for each tournament. This includes check-in times, match schedules, and result reporting. Failure to comply may result in disqualification.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">3. User Content</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            By posting content (e.g., team logos, comments), you grant Zenith Esports a license to use, display, and distribute such content in connection with the service. You represent that you own or have the necessary rights to the content you post.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">4. Intellectual Property</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Relating to the Service, including but not limited to text, graphics, logos, and code, is the property of Zenith Esports and is protected by copyright and other intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">5. Disclaimer</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            The service is provided on an "AS IS" and "AS AVAILABLE" basis. Zenith Esports makes no representations or warranties of any kind, express or implied, regarding the operation of the service or the information, content, or materials included.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">6. Changes</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            We reserve the right to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">7. Contact</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            If you have any questions about these Terms, please contact us at: <span className="text-gold">zenithesportsmgmt@gmail.com</span>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
