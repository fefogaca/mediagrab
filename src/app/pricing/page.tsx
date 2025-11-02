
import React from 'react';
import Link from 'next/link';
import StandardLayout from '../components/StandardLayout';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PricingPage = () => {
  const tiers = [
    {
      name: 'Developer',
      price: 'Free',
      description: 'For personal projects and exploring the API.',
      features: [
        '100 API calls/month',
        'Community support',
      ],
      cta: 'Get Started',
      href: '/register',
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
      href: '/register',
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

                <Link href={tier.href} className={`mt-8 block w-full py-3 px-6 text-center rounded-md font-medium ${tier.mostPopular ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-100 dark:bg-gray-700 text-violet-600 dark:text-violet-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default PricingPage;
