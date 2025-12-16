
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState<{ num1: number; num2: number; operator: string; answer: number } | null>(null);
  const [captchaError, setCaptchaError] = useState('');
  const router = useRouter();

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer: number;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '×':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }
    
    setCaptchaQuestion({ num1, num2, operator, answer });
    setCaptchaAnswer('');
    setCaptchaError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    // Validar captcha
    if (!captchaQuestion) {
      setCaptchaError('Por favor, resolva o captcha');
      return;
    }

    const userAnswer = parseInt(captchaAnswer);
    if (isNaN(userAnswer) || userAnswer !== captchaQuestion.answer) {
      setCaptchaError('Resposta incorreta. Tente novamente.');
      generateCaptcha();
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { role, token } = data;
      
      // Salvar token no localStorage para verificação no cliente
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // Redirecionar baseado no role
      if (role === 'admin') {
      router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
      generateCaptcha(); // Regenerar captcha em caso de erro
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 sm:p-10 space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-sky-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-sky-600 dark:from-violet-400 dark:to-sky-400">Admin Login</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Bem-vindo de volta, por favor insira suas credenciais.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="block w-full px-4 py-3 text-gray-900 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-all"
              placeholder="Digite seu usuário"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-4 py-3 text-gray-900 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-all"
              placeholder="Digite sua senha"
            />
          </div>
          
          {/* Captcha */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Verificação de Segurança
            </label>
            {captchaQuestion && (
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{captchaQuestion.num1}</span>
                  <span className="text-xl font-semibold text-gray-600 dark:text-gray-400">{captchaQuestion.operator}</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{captchaQuestion.num2}</span>
                  <span className="text-xl font-semibold text-gray-600 dark:text-gray-400">=</span>
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-20 px-3 py-2 text-center text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-violet-500 focus:outline-none focus:border-violet-600 dark:focus:border-violet-400"
                    placeholder="?"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2 text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  title="Gerar novo captcha"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
            {captchaError && (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {captchaError}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
              <p className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
          
          <button 
            type="submit" 
            className="group relative w-full px-6 py-4 font-semibold text-white bg-gradient-to-r from-violet-600 to-sky-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Entrar
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-sky-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
