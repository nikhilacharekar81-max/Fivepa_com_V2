import React from 'react';
import { LEGAL_DRAFT_NOTICE } from '../constants';
import { ShieldCheck, FileText, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'refund-policy';

interface LegalPageProps {
  type: LegalDocType;
  navigate?: (to: string, e?: React.MouseEvent) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, navigate }) => {
  const handleNav = (to: string, e: React.MouseEvent) => {
    if (navigate) {
      navigate(to, e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => handleNav('/', e)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Version 1.0 (Draft)
          </div>
        </div>

        {/* Prominent Legal Draft Warning Banner */}
        {LEGAL_DRAFT_NOTICE && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold uppercase tracking-wider block text-amber-800 mb-0.5">Notice</span>
              {LEGAL_DRAFT_NOTICE}. The policies set forth on this page represent operational platform mechanics and draft terms subject to official regulatory and legal review.
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm gap-2">
          <a
            href="/terms"
            onClick={(e) => handleNav('/terms', e)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              type === 'terms'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </a>
          <a
            href="/privacy"
            onClick={(e) => handleNav('/privacy', e)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              type === 'privacy'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            Privacy Policy
          </a>
          <a
            href="/refund-policy"
            onClick={(e) => handleNav('/refund-policy', e)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              type === 'refund-policy'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Refund & Escrow Policy
          </a>
        </div>

        {/* Document Body */}
        <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 border-t-0 p-6 sm:p-10 space-y-8 text-slate-700 leading-relaxed">
          {type === 'terms' && (
            <>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
                <p className="text-sm text-slate-500 mt-1">Last Updated: November 2026</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">1. User Accounts & Eligibility</h2>
                <p className="text-sm">
                  To access our marketplace, you must register an account and be at least 18 years of age. You agree to provide accurate, current, and complete information during registration. Each individual or entity may maintain only one active primary account. Account credentials must remain confidential. You are solely responsible for all actions conducted under your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">2. Buyers and Sellers</h2>
                <p className="text-sm">
                  <strong>Buyers</strong> engage freelancers by ordering published Gigs or hiring professionals for custom Projects. Buyers agree to fund orders via approved payment methods prior to work commencement.
                </p>
                <p className="text-sm">
                  <strong>Sellers (Freelancers)</strong> offer defined digital services and deliverables. Sellers warrant that they possess the skills, licenses, and rights to complete all accepted orders professionally and on schedule.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">3. Escrow & How Funds Are Held</h2>
                <p className="text-sm">
                  All marketplace transactions utilize Escrow-protected payments. When a buyer places an order or approves a project proposal, the full purchase amount is immediately captured and held in our double-entry ledger escrow.
                </p>
                <p className="text-sm">
                  Funds remain safely isolated in escrow and are never released to the seller until:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>The buyer reviews the delivered work and explicitly releases funds; or</li>
                  <li>The statutory 7-day review period expires without a dispute or cancellation being initiated (as detailed below); or</li>
                  <li>An administrative dispute resolution results in an authorized release.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">4. Fees, Commissions & Payouts</h2>
                <p className="text-sm">
                  WorkPerHour operates with transparent, tiered platform fees:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Freelancer Service Commission:</strong> A standard platform fee is deducted from the seller&apos;s earnings upon fund release.</li>
                  <li><strong>Client Service Fee:</strong> A nominal processing fee may be charged to buyers at checkout to cover merchant processing and fraud protection.</li>
                  <li><strong>Small Order Fee:</strong> Fixed micro-charges applied to transactions below defined minimum order thresholds.</li>
                  <li><strong>Clearing Period:</strong> Released earnings enter an escrow clearing buffer before becoming available for withdrawal via approved payout methods.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">5. 7-Day Auto-Release of Project Invoices & Dispute Pauses</h2>
                <p className="text-sm">
                  When a seller submits a deliverable and a final invoice on a project workstream, the buyer receives a <strong>7-calendar-day review window</strong> to inspect the deliverables, request revisions, or accept the invoice.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                  <p className="font-semibold text-slate-900">How the review window operates:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>The system sends reminders to the buyer upon invoice submission, on Day 3, on Day 6, and 24 hours prior to expiration.</li>
                    <li>If the buyer takes no action by the exact 7-day deadline, our automated background release job approves the invoice and releases escrow funds to the seller.</li>
                    <li><strong>Important:</strong> Requesting a revision, filing a formal dispute, or submitting a cancellation request immediately <em>pauses</em> the countdown timer. Funds will not auto-release while any dispute or revision request remains unresolved.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">6. Content Ownership & Intellectual Property</h2>
                <p className="text-sm">
                  Upon full release of escrow funds to the seller, all intellectual property rights, title, and interest in the bespoke deliverables created for that order transfer irrevocably to the buyer, unless expressly agreed otherwise in writing prior to work commencing. Sellers retain ownership of pre-existing tools, libraries, or general background IP.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">7. Prohibited Items & Activities</h2>
                <p className="text-sm">
                  Users may not offer, request, or engage in:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Unlawful, fraudulent, or infringing software, malware, or illicit hacking tools;</li>
                  <li>Academic dishonesty, essay cheating, or credential forging;</li>
                  <li>Circumventing platform communication, escrow, or off-platform payment solicitations;</li>
                  <li>Harassment, abusive conduct, or hate speech in workstreams;</li>
                  <li>Artificial reviews, fake gig inflation, or coordinated manipulation of ratings.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">8. Account Suspension & Termination</h2>
                <p className="text-sm">
                  We reserve the right to temporarily freeze or permanently terminate accounts found violating these Terms, engaging in off-platform payment circumvention, or presenting fraudulent identities. In the event of account suspension, pending escrow balances are audited to ensure all valid buyer orders and seller commitments are satisfied.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">9. Contact & Inquiries</h2>
                <p className="text-sm">
                  For legal inquiries, terms clarification, or notices, contact our compliance team at <span className="font-semibold text-slate-900">support@workperhour.com</span>.
                </p>
              </section>
            </>
          )}

          {type === 'privacy' && (
            <>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
                <p className="text-sm text-slate-500 mt-1">Last Updated: November 2026</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">1. Personal Data Collected</h2>
                <p className="text-sm">
                  We collect information necessary to provide a secure marketplace, facilitate escrow transactions, and maintain account integrity:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Identity Information:</strong> Name, username, email address, country, profile picture, and bio.</li>
                  <li><strong>Work & Project Data:</strong> Gig descriptions, proposals, delivery attachments, workstream messages, and review ratings.</li>
                  <li><strong>Financial Information:</strong> Transaction histories, escrow records, and encrypted payout references (card numbers and payment secrets are processed directly by certified gateways like PayPal).</li>
                  <li><strong>Technical & Device Data:</strong> IP addresses, browser user-agent, session tokens, device fingerprint identifiers for security verification, and audit access logs.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">2. Cookies & Local Storage</h2>
                <p className="text-sm">
                  We use strictly necessary session cookies and local storage tokens to keep you logged in, remember your active session, maintain CSRF defense, and ensure security. We do not sell your personal browsing information to third-party ad networks.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">3. How We Use Your Data</h2>
                <p className="text-sm">Your data is utilized to:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Facilitate buyer-seller orders, escrow holding, and automated invoice delivery;</li>
                  <li>Deliver transactional email reminders (order updates, 7-day invoice review notifications);</li>
                  <li>Detect and prevent platform circumvention, identity fraud, and malicious activity;</li>
                  <li>Maintain immutable double-entry financial audit logs required for accounting compliance.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">4. Data Retention</h2>
                <p className="text-sm">
                  Active account information is retained for as long as your account remains open. Financial transaction records, escrow journals, and order invoices are retained for a minimum statutory period (typically 7 years) in accordance with tax and financial record-keeping obligations.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">5. Deletion & Access Requests</h2>
                <p className="text-sm">
                  You have the right to request a copy of your personal data or to request account deletion. Upon receiving a verified request:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Your public profile, gigs, and user credentials will be deactivated and anonymized;</li>
                  <li>Pending or historical orders with active escrow must be completely settled prior to deletion;</li>
                  <li>Statutory financial ledger records will be preserved in accordance with financial regulations.</li>
                </ul>
                <p className="text-sm mt-2">
                  To submit a data access or deletion request, email <span className="font-semibold text-slate-900">privacy@workperhour.com</span> with your registered account details.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">6. Contacting Privacy Compliance</h2>
                <p className="text-sm">
                  If you have questions regarding this Privacy Policy or data processing practices, please contact us at <span className="font-semibold text-slate-900">privacy@workperhour.com</span>.
                </p>
              </section>
            </>
          )}

          {type === 'refund-policy' && (
            <>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Refund & Escrow Policy</h1>
                <p className="text-sm text-slate-500 mt-1">Last Updated: November 2026</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">1. Escrow Protection Model</h2>
                <p className="text-sm">
                  Every order on WorkPerHour is backed by Escrow-protected payments. When a buyer places an order, funds are isolated from the seller until work is delivered and accepted. This safeguards buyers from non-delivery and guarantees sellers that verified funds are waiting upon satisfactory completion.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">2. Refunds & Cancellation Before Delivery</h2>
                <p className="text-sm">
                  If an order has not been delivered or if a mutual cancellation request is approved by both parties prior to work completion:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Full Refund:</strong> 100% of the held escrow amount is refunded directly back to the buyer&apos;s marketplace wallet balance or original payment method.</li>
                  <li><strong>Seller Inactivity:</strong> If a seller fails to respond or accept an order within designated start windows, the buyer may cancel and claim an immediate full refund.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">3. Partial Refunds</h2>
                <p className="text-sm">
                  In projects where a portion of deliverables was satisfactorily completed but the remaining milestones cannot be finalized, the parties may agree to a <strong>partial refund</strong>. The agreed portion is released to the seller for completed work, and the remaining escrow balance is refunded to the buyer.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">4. The 7-Day Auto-Release Rule & Pausing Conditions</h2>
                <p className="text-sm">
                  Upon deliverable and invoice submission on project workstreams, buyers have exactly 7 calendar days to inspect the deliverable.
                </p>
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-sm space-y-2">
                  <p className="font-semibold text-slate-900">Conditions that immediately pause auto-release:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li><strong>Revision Requests:</strong> Submitting a revision request pauses the auto-release timer until the seller delivers a new revision.</li>
                    <li><strong>Dispute Initiation:</strong> Opening a formal dispute locks the escrow in dispute status. Neither auto-release nor unilateral withdrawals can occur while an investigation is pending.</li>
                    <li><strong>Pending Cancellation:</strong> Initiating an order cancellation freezes the escrow until the other party responds.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">5. Formal Dispute Process</h2>
                <p className="text-sm">
                  If a buyer and seller reach an impasse regarding deliverable quality or scope compliance:
                </p>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Either party can initiate a dispute through the order action menu.</li>
                  <li>Both parties are requested to submit evidence, workstream logs, and scope agreements within 72 hours.</li>
                  <li>Marketplace Dispute Mediators review the workstream, delivery files, and requirements against original order specifications.</li>
                  <li>Mediators issue an authoritative, binding determination (Release to Freelancer, Refund to Buyer, or Split Allocation).</li>
                </ol>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">6. Inquiries & Dispute Support</h2>
                <p className="text-sm">
                  To request assistance with an active escrow refund or dispute, contact <span className="font-semibold text-slate-900">support@workperhour.com</span> with your Order ID.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
