'use client';

import ResponsiveNavbar from '@/components/lp-redesign/responsive-navbar';
import Footer from '@/components/lp-components/footer';

export default function PrivacyPolicy() {
  return (
    <>
      <ResponsiveNavbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-slate lg:prose-lg mx-auto">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy for Franko.ai</h1>
          <p className="text-gray-600 mb-8"><strong>Effective Date:</strong> 22/03/2025</p>

          <p>Welcome to Franko.ai, a B2B customer conversation tool that allows businesses to create and send Conversation instances to their customers. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our service. By using Franko.ai, you agree to the terms outlined in this policy.</p>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul>
            <li><strong>Personal Information:</strong> When you sign up for our service, we collect your email address. If you choose to provide additional information, such as your name, we will collect that as well.</li>
            <li><strong>Conversation Data:</strong> When you create Conversations, we collect the Conversation responses provided by your customers. This includes email addresses of your customers&apos; customers, which appear on your customer portal, and any other information they choose to provide in their responses.</li>
          </ul>
          <p>We do not collect sensitive data such as health or financial information.</p>

          <h2 className="text-2xl font-semibold mt-8">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our converation tool service.</li>
            <li>Improve our service and user experience based on your feedback and usage patterns.</li>
            <li>Communicate with you about your account and our service.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">3. How We Collect Information</h2>
          <p>We collect information directly from you when you:</p>
          <ul>
            <li>Sign up for an account.</li>
            <li>Create and send Conversations.</li>
            <li>Respond to Conversations (if you are a customer of one of our users).</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">4. Data Storage and Security</h2>
          <p>Your information is stored on servers provided by Supabase, our database hosting provider. We rely on Supabase&apos;s security measures to protect your data. For more information about Supabase&apos;s security practices, please visit their <a href="https://supabase.com" className="text-blue-600 hover:text-blue-800">website</a>.</p>

          <h2 className="text-2xl font-semibold mt-8">5. Sharing of Information</h2>
          <p>We share your information with the following third parties:</p>
          <ul>
            <li><strong>Stripe:</strong> We use Stripe to process payments. Stripe collects and processes your payment information in accordance with their <a href="https://stripe.com/privacy" className="text-blue-600 hover:text-blue-800">privacy policy</a>.</li>
            <li><strong>Vercel:</strong> Our service is hosted on Vercel, which may collect usage data for analytics purposes. For more details, see Vercel&apos;s <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:text-blue-800">privacy policy</a>.</li>
            <li><strong>Clerk:</strong> We use Clerk for user authentication. Clerk collects and processes authentication data in accordance with their <a href="https://clerk.com/privacy" className="text-blue-600 hover:text-blue-800">privacy policy</a>.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and download your personal information.</li>
            <li>Request deletion of your personal information.</li>
          </ul>
          <p>Currently, to exercise these rights, please email us at fletcher@franko.ai. We are working on building functionality into our application to allow you to manage your data directly.</p>

          <h2 className="text-2xl font-semibold mt-8">7. Data Retention</h2>
          <p>We retain your personal information for as long as your account is active. If you delete your account or specific data from within the application, we will delete that information accordingly.</p>

          <h2 className="text-2xl font-semibold mt-8">8. Third-Party Services</h2>
          <p>Our service integrates with third-party services, including Clerk for authentication, Stripe for payments, and Vercel for hosting. These services have their own privacy policies, and we encourage you to review them.</p>

          <h2 className="text-2xl font-semibold mt-8">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on our website and updating the effective date.</p>

          <h2 className="text-2xl font-semibold mt-8">10. Contact Us</h2>
          <p>If you have any questions or concerns about this Privacy Policy, please contact us at fletcher@franko.ai.</p>

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