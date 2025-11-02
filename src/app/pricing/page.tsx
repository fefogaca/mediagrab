
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import StandardLayout from '../components/StandardLayout';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PricingPage = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetStarted = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-free-api-key', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setApiKey(data.apiKey);
      } else {
        throw new Error(data.message || 'Failed to generate API key.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      name: 'Developer',
      price: 'Free',
      description: 'For personal projects and exploring the API.',
      features: [
        '5 API calls/month',
        'Community support',
      ],
      cta: 'Get Started',
      href: '#',
      mostPopular: false,
    },
    {
      name: 'Pro',
      price: '$10',
      priceSuffix: '/ month',
      description: 'For production applications with growing usage.',
      features: [
        '10,000 API calls/month',
        'Email support',
        'Access to all features',
      ],
      cta: 'Choose Pro',
      href: '/contact',
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large-scale applications requiring custom limits and support.',
      features: [
        'Unlimited API calls',
        'Dedicated support & SLA',
        'Custom integration help',
      ],
      cta: 'Contact Us',
      href: '/contact',
      mostPopular: false,
    },
  ];

  return (
    <StandardLayout>
      <div className="bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">Pricing Plans</h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">Simple, transparent pricing for projects of all sizes.</p>
          </div>

          <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            {tiers.map((tier) => (
              <div key={tier.name} className={`relative p-8 bg-white dark:bg-gray-800 border ${tier.mostPopular ? 'border-violet-500' : 'border-gray-200 dark:border-gray-700'} rounded-2xl shadow-sm flex flex-col`}>
                {tier.mostPopular && (
                  <div className="absolute top-0 -translate-y-1/2 px-3 py-1 text-sm font-semibold tracking-wide text-white bg-violet-500 rounded-full shadow-md">Most Popular</div>
                )}
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
                <p className="mt-4 text-gray-500 dark:text-gray-400">{tier.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{tier.price}</span>
                  {tier.priceSuffix && <span className="text-base font-medium text-gray-500 dark:text-gray-400">{tier.priceSuffix}</span>}
                </div>

                <ul className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0"><CheckIcon /></div>
                      <p className="ml-3 text-base text-gray-700 dark:text-gray-300">{feature}</p>
                    </li>
                  ))}
                </ul>

                <button onClick={tier.name === 'Developer' ? handleGetStarted : undefined} disabled={loading} className={`mt-8 block w-full py-3 px-6 text-center rounded-md font-medium ${tier.mostPopular ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-100 dark:bg-gray-700 text-violet-600 dark:text-violet-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {loading && tier.name === 'Developer' ? 'Generating...' : tier.cta}
                </button>
                {tier.name === 'Developer' && apiKey && (
                  <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-200">Your API Key:</p>
                    <p className="text-lg font-mono text-green-900 dark:text-green-100 break-all">{apiKey}</p>
                  </div>
                )}
                {tier.name === 'Developer' && error && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default PricingPage;
