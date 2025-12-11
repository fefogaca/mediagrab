"use client";

import React from 'react';
import Link from 'next/link';
import LegalPageLayout from '../components/LegalPageLayout';
import { useTranslation } from '@/lib/i18n';

const TermsOfServicePage = () => {
  const { t } = useTranslation();
  
  return (
    <LegalPageLayout title={t.terms.title}>
      <p><strong>{t.terms.lastUpdated}:</strong> November 02, 2025</p>
      <p>{t.terms.intro}</p>
      
      <h2>{t.terms.sections.acceptance.title}</h2>
      <p>{t.terms.sections.acceptance.content}</p>

      <h2>{t.terms.sections.service.title}</h2>
      <p>{t.terms.sections.service.content}</p>

      <h2>{t.terms.sections.disclaimer.title}</h2>
      <p>{t.terms.sections.disclaimer.content}</p>

      <h2>{t.terms.sections.usage.title}</h2>
      <p>{t.terms.sections.usage.content}</p>

      <h2>{t.terms.sections.account.title}</h2>
      <p>{t.terms.sections.account.content}</p>

      <h2>{t.terms.sections.payment.title}</h2>
      <p>{t.terms.sections.payment.content}</p>

      <h2>{t.terms.sections.termination.title}</h2>
      <p>{t.terms.sections.termination.content}</p>

      <h2>{t.terms.sections.liability.title}</h2>
      <p>{t.terms.sections.liability.content}</p>

      <h2>{t.terms.sections.changes.title}</h2>
      <p>{t.terms.sections.changes.content}</p>

      <h2>{t.terms.sections.contact.title}</h2>
      <p>{t.terms.sections.contact.content} <Link href="/contact">{t.nav.contact}</Link>.</p>
    </LegalPageLayout>
  );
};

export default TermsOfServicePage;