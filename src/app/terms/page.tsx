import React from 'react';
import Link from 'next/link';
import LegalPageLayout from '../components/LegalPageLayout';

const TermsOfServicePage = () => {
  return (
    <LegalPageLayout title="Terms of Service">
      <p><strong>Last updated:</strong> November 02, 2025</p>
  <p>Please read these Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot;) carefully before using the MediaGrab API (the &quot;Service&quot;) operated by MediaGrab (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).</p>
      
      <h2>1. Acknowledgment</h2>
      <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>

      <h2>2. Service Description</h2>
  <p>The Service provides an application programming interface (API) that allows users to programmatically access information and download links for media from various third-party platforms. The functionality and availability of the Service are provided on an &quot;as is&quot; and &quot;as available&quot; basis.</p>

      <h2>3. Disclaimer of Affiliation</h2>
      <p>MediaGrab is an independent service and is <strong>not affiliated, associated, authorized, endorsed by, or in any way officially connected with</strong> any of the third-party platforms from which media can be accessed (e.g., YouTube, TikTok, etc.), or any of their subsidiaries or affiliates. All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.</p>

      <h2>4. User Responsibilities</h2>
      <p>You are solely responsible for your use of the Service. You agree not to use the Service for any purpose that is illegal or prohibited by these Terms. You are responsible for ensuring that your use of the Service and any content you download complies with all applicable laws, including but not limited to <strong>copyright and intellectual property laws</strong>. We are not responsible for the content you access or download through the Service.</p>

      <h2>5. User Accounts</h2>
      <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>

      <h2>6. Termination</h2>
      <p>We may terminate or suspend your access to our Service immediately, without prior notice or liability, for any reason whatsoever, including, without limitation, if you breach these Terms.</p>

      <h2>7. Limitation of Liability</h2>
      <p>In no event shall MediaGrab, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

      <h2>8. Changes to These Terms</h2>
  <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

      <h2>9. Contact Us</h2>
      <p>If you have any questions about these Terms, please <Link href="/contact">contact us</Link>.</p>
    </LegalPageLayout>
  );
};

export default TermsOfServicePage;