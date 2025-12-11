"use client";

import React from 'react';
import Link from 'next/link';
import LegalPageLayout from '../components/LegalPageLayout';
import { useTranslation } from '@/lib/i18n';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();
  
  return (
    <LegalPageLayout title={t.privacy.title}>
      <p><strong>{t.privacy.lastUpdated}:</strong> November 02, 2025</p>
      <p>{t.privacy.intro}</p>
      
      <h2>{t.privacy.sections.interpretation.title}</h2>
      <p>{t.privacy.sections.interpretation.content}</p>

      <h2>{t.privacy.sections.collection.title}</h2>
      <h3>{t.privacy.sections.collection.subtitle}</h3>
      <h4>{t.privacy.sections.collection.personalDataTitle}</h4>
      <p>{t.privacy.sections.collection.personalDataContent}</p>
      <ul>
        {t.privacy.sections.collection.personalDataList.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      
      <h4>{t.privacy.sections.collection.usageDataTitle}</h4>
      <p>{t.privacy.sections.collection.usageDataContent}</p>

      <h2>{t.privacy.sections.usage.title}</h2>
      <p>{t.privacy.sections.usage.content}</p>
      <ul>
        {t.privacy.sections.usage.list.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h2>{t.privacy.sections.sharing.title}</h2>
      <p>{t.privacy.sections.sharing.content}</p>

      <h2>{t.privacy.sections.security.title}</h2>
      <p>{t.privacy.sections.security.content}</p>

      <h2>{t.privacy.sections.changes.title}</h2>
      <p>{t.privacy.sections.changes.content}</p>

      <h2>{t.privacy.sections.contact.title}</h2>
      <p>{t.privacy.sections.contact.content} <Link href="/contact">{t.nav.contact}</Link>.</p>
    </LegalPageLayout>
  );
};

export default PrivacyPolicyPage;