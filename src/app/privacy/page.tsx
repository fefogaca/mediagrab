import React from 'react';
import Link from 'next/link';
import LegalPageLayout from '../components/LegalPageLayout';

const PrivacyPolicyPage = () => {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p><strong>Last updated:</strong> November 02, 2025</p>
      <p>This Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
      
      <h2>1. Interpretation and Definitions</h2>
      <p>For the purposes of this Privacy Policy, terms such as "You", "We", "Service", and "Personal Data" carry specific meanings as defined herein and in our Terms of Service.</p>

      <h2>2. Collecting and Using Your Personal Data</h2>
      <h3>Types of Data Collected</h3>
      <h4>Personal Data</h4>
      <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. This may include, but is not limited to:</p>
      <ul>
        <li>Email address</li>
        <li>First name and last name</li>
        <li>Usage Data</li>
      </ul>
      
      <h4>Usage Data</h4>
      <p>Usage Data is collected automatically when using the Service. This may include information such as Your device's IP address, browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, API requests made, and other diagnostic data.</p>

      <h2>3. Use of Your Personal Data</h2>
      <p>The Company may use Personal Data for the following purposes:</p>
      <ul>
        <li><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service and process API requests.</li>
        <li><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service.</li>
        <li><strong>To contact You:</strong> To contact You by email regarding updates or informative communications related to the functionalities, products, or contracted services.</li>
        <li><strong>For security purposes:</strong> to prevent fraud, enforce our policies, and protect our intellectual property.</li>
      </ul>

      <h2>4. Disclosure of Your Personal Data</h2>
      <p>We do not sell or rent your personal data to third parties. We may share your information in the following situations: with service providers to monitor and analyze the use of our Service, or to comply with a legal obligation.</p>

      <h2>5. Security of Your Personal Data</h2>
      <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>

      <h2>6. Changes to this Privacy Policy</h2>
      <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

      <h2>7. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please <Link href="/contact">contact us</Link>.</p>
    </LegalPageLayout>
  );
};

export default PrivacyPolicyPage;