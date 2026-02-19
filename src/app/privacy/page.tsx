import { Shield, Lock, Eye, Database } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                    Privacy <span className="text-gold">Policy</span>
                </h1>
                <p className="text-text-secondary text-sm">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-8">
                {/* Introduction */}
                <div className="glass-card p-8">
                    <p className="text-text-secondary leading-relaxed mb-4">
                        At Zenith Esports, we value your privacy and are committed to protecting your personal information.
                        This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
                    </p>
                    <p className="text-text-secondary leading-relaxed">
                        By using our services, you agree to the collection and use of information in accordance with this policy.
                    </p>
                </div>

                {/* Key Points Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <Database size={20} />
                            </div>
                            <h2 className="font-heading text-lg font-bold">Data Collection</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            We collect information you provide directly to us, such as when you create an account, register for a tournament, or contact support. This includes your name, email, game ID, and team details.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <Eye size={20} />
                            </div>
                            <h2 className="font-heading text-lg font-bold">Data Usage</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            We use your data to facilitate tournament operations, verify identities, process payments (if applicable), and improve our platform. We do NOT sell your personal data to third parties.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <Lock size={20} />
                            </div>
                            <h2 className="font-heading text-lg font-bold">Security</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            We implement industry-standard security measures to protect your unauthorized access, alteration, disclosure, or destruction of your personal data.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <Shield size={20} />
                            </div>
                            <h2 className="font-heading text-lg font-bold">Your Rights</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            You have the right to access, correct, or delete your personal information. You can manage most of your data directly through your profile settings.
                        </p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="glass-card p-8 space-y-8">
                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">1. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2 text-text-secondary text-sm">
                            <li><strong>Account Information:</strong> Name, email address, password, and profile details.</li>
                            <li><strong>Gaming Profiles:</strong> In-game names (IGN), character IDs, and team affiliations.</li>
                            <li><strong>Usage Data:</strong> Information about how you access and use our platform, including device info and log data.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">2. How We Use Your Information</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            We use collected information to:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-2 text-text-secondary text-sm">
                            <li>Process tournament registrations and verify eligibility.</li>
                            <li>Manage leaderboards and tournament brackets.</li>
                            <li>Communicate with you regarding updates, schedules, and issues.</li>
                            <li>Detect and prevent fraud or cheating.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">3. Third-Party Services</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            We may use third-party services for authentication (e.g., Google login), analytics, or hosting. These parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">4. Cookies</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            We use cookies and similar tracking technologies to track the activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl font-bold text-gold mb-3">5. Contact Us</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at: <span className="text-gold">zenithesportsmgmt@gmail.com</span>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
