'use client';

import Nav from '@/components/lp-components/nav';
import Footer from '@/components/lp-components/footer';

export default function TermsAndConditions() {
  return (
    <>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-slate lg:prose-lg mx-auto">
          <h1 className="text-3xl font-bold mb-8">Terms and Conditions for Franko.ai</h1>
          <p className="text-gray-600 mb-8"><strong>Effective Date:</strong> 22/03/2025</p>

          <p>Welcome to Franko.ai, a B2B survey tool designed for businesses to create and send surveys to their customers. By accessing or using Franko.ai, you agree to these Terms and Conditions. Please read them carefully.</p>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">1. Acceptance of Terms</h2>
          <p>By using Franko.ai, you confirm that you are an authorized representative of your business and agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, you may not use our service.</p>

          <h2 className="text-2xl font-semibold mt-8">2. Use of the Service</h2>
          <ul>
            <li><strong>Eligibility:</strong> You must be at least 18 years old and authorized to represent your business to use Franko.ai. By using our service, you confirm you meet these requirements.</li>
            <li><strong>Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
            <li><strong>Prohibited Activities:</strong> You may not use Franko.ai for any illegal purposes, including but not limited to phishing, spamming, distributing malware, infringing intellectual property rights, or any actions that could harm Franko.ai, its users, or third parties.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">3. Subscription and Payment</h2>
          <ul>
            <li><strong>Free Trial:</strong> Franko.ai offers a usage-based free trial. Details and limitations of the free trial are available on our website.</li>
            <li><strong>Subscription:</strong> After the free trial, Franko.ai operates on a subscription basis. You agree to pay the fees outlined on our website.</li>
            <li><strong>Payment Processing:</strong> Payments are processed via Stripe. By subscribing, you accept Stripe&apos;s <a href="https://stripe.com/legal" className="text-blue-600 hover:text-blue-800">terms of service</a>.</li>
            <li><strong>Cancellation and Refunds:</strong> You may cancel your subscription at any time through your account settings. Full refunds are available if requested within the same month as the payment. No refunds are provided for unused portions of a subscription period after the month of payment.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">4. Intellectual Property</h2>
          <ul>
            <li><strong>Ownership:</strong> All content, including text, graphics, logos, and software provided by Franko.ai, is owned by Franko.ai (ABN 59140717232) or our licensors and is protected by intellectual property laws.</li>
            <li><strong>License:</strong> We grant you a limited, non-exclusive, non-transferable license to use Franko.ai for your business purposes.</li>
            <li><strong>User Content:</strong> You own the customer response data you collect using Franko.ai. You grant Franko.ai a worldwide, non-exclusive, royalty-free license to use, store, and display your content solely to provide and improve our service.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">5. Data Privacy</h2>
          <ul>
            <li><strong>Privacy Policy:</strong> Our Privacy Policy, incorporated herein, governs how we collect, use, and protect your personal information.</li>
            <li><strong>Data Security:</strong> We implement reasonable security measures to protect your data, but cannot guarantee absolute security. You are responsible for securing your account.</li>
            <li><strong>Data Retention:</strong> We store your data as long as you maintain an account with Franko.ai. Upon account deletion, your data will be deleted after a reasonable period or sooner if you request it.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">6. Termination</h2>
          <ul>
            <li><strong>By You:</strong> You may terminate your account at any time through your account settings.</li>
            <li><strong>By Us:</strong> We may suspend or terminate your account at our discretion, with or without notice, for any violation of these Terms.</li>
            <li><strong>Effect of Termination:</strong> Upon termination, your access to Franko.ai ends immediately. Your data will be deleted after a reasonable period or sooner upon request. Provisions such as ownership, disclaimers, and liability limits will survive termination.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">7. Disclaimers and Limitations of Liability</h2>
          <ul>
            <li><strong>Disclaimer of Warranties:</strong> Franko.ai is provided "as is" and "as available" without any warranties, express or implied.</li>
            <li><strong>Limitation of Liability:</strong> To the fullest extent permitted by Australian law, Franko.ai (ABN 59140717232) is not liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill arising from your use of Franko.ai, unauthorized access, service interruptions, or third-party actions.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">8. Governing Law and Dispute Resolution</h2>
          <ul>
            <li><strong>Governing Law:</strong> These Terms are governed by the laws of Australia.</li>
            <li><strong>Dispute Resolution:</strong> Any disputes arising from these Terms will be resolved in the courts of Australia.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">9. Changes to These Terms</h2>
          <p>We may update these Terms and Conditions from time to time. Minor changes will be posted on our website with an updated effective date. For substantial changes, we will notify you via email. Your continued use of Franko.ai after any changes signifies your acceptance of the updated Terms.</p>

          <h2 className="text-2xl font-semibold mt-8">10. Contact Us</h2>
          <p>For questions about these Terms and Conditions, please contact us at fletcher@franko.ai.</p>

          <hr className="my-8" />

          <footer className="text-gray-600 mt-8">
            <p><strong>Franko.ai</strong></p>
            <p>ABN: 59140717232</p>
          </footer>
        </article>
      </div>
      <Footer />
    </>
  );
} 