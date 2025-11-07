
import React from 'react';
import StandardLayout from '../components/StandardLayout';

const ContactPage = () => {
  return (
    <StandardLayout>
      <div className="min-h-screen py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium border border-violet-200 dark:border-violet-800">
                📧 Entre em Contato
              </span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mt-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 dark:from-violet-400 dark:via-purple-400 dark:to-sky-400">
                Contact Us
              </span>
            </h2>
            <p className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300">
              Tem uma pergunta ou feedback? Adoraríamos ouvir de você.
            </p>
          </div>
          <form action="#" method="POST" className="mx-auto mt-16 max-w-2xl sm:mt-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200 mb-2">Nome</label>
                <div className="mt-2.5">
                  <input type="text" name="first-name" id="first-name" autoComplete="given-name" className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 dark:focus:ring-violet-400 sm:text-sm sm:leading-6 transition-all" />
                </div>
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200 mb-2">Sobrenome</label>
                <div className="mt-2.5">
                  <input type="text" name="last-name" id="last-name" autoComplete="family-name" className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 dark:focus:ring-violet-400 sm:text-sm sm:leading-6 transition-all" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200 mb-2">Email</label>
                <div className="mt-2.5">
                  <input type="email" name="email" id="email" autoComplete="email" className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 dark:focus:ring-violet-400 sm:text-sm sm:leading-6 transition-all" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200 mb-2">Mensagem</label>
                <div className="mt-2.5">
                  <textarea name="message" id="message" rows={6} className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 dark:focus:ring-violet-400 sm:text-sm sm:leading-6 transition-all resize-none" defaultValue={''} />
                </div>
              </div>
            </div>
            <div className="mt-10">
              <button type="submit" className="group relative w-full rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 px-6 py-4 text-center text-base font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Enviar Mensagem
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-sky-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </StandardLayout>
  );
};

export default ContactPage;
