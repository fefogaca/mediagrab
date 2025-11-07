
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
  const [copied, setCopied] = useState(false);

  const handleCopyApiKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="min-h-screen py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium border border-violet-200 dark:border-violet-800">
                💰 Planos Transparentes
              </span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mt-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400">
                Pricing Plans
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed">Preços simples e transparentes para projetos de todos os tamanhos.</p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-8">
            {tiers.map((tier, index) => (
              <div 
                key={tier.name} 
                className={`relative group p-8 bg-white dark:bg-gray-800 border-2 ${tier.mostPopular ? 'border-violet-500 dark:border-violet-400 shadow-2xl shadow-violet-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-2xl shadow-lg hover:shadow-2xl flex flex-col transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {tier.mostPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-sm font-bold tracking-wide text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-full shadow-lg">
                    Mais Popular
                  </div>
                )}
                <div className="mt-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                  <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{tier.description}</p>
                  <div className="mt-6 flex items-baseline">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{tier.price}</span>
                    {tier.priceSuffix && <span className="ml-2 text-lg font-medium text-gray-500 dark:text-gray-400">{tier.priceSuffix}</span>}
                  </div>
                </div>

                <ul className="mt-8 space-y-4 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5"><CheckIcon /></div>
                      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {tier.name === 'Developer' ? (
                    <button 
                      onClick={handleGetStarted} 
                      disabled={loading} 
                      className="w-full py-4 px-6 text-center rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Gerando...
                        </span>
                      ) : tier.cta}
                    </button>
                  ) : (
                    <Link 
                      href={tier.href}
                      className={`block w-full py-4 px-6 text-center rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                        tier.mostPopular 
                          ? 'bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40' 
                          : 'bg-gray-100 dark:bg-gray-700 text-violet-600 dark:text-violet-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  )}
                  {tier.name === 'Developer' && apiKey && (
                    <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Sua API Key:</p>
                        <button
                          onClick={handleCopyApiKey}
                          className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                        >
                          {copied ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Copiado!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={handleCopyApiKey}
                        className="w-full text-left text-base font-mono text-emerald-900 dark:text-emerald-100 break-all bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                      >
                        {apiKey}
                      </button>
                    </div>
                  )}
                  {tier.name === 'Developer' && error && (
                    <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                      <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default PricingPage;
