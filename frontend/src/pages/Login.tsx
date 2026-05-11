import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (username: string, userId: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (signUpError) throw signUpError;
        setRegistered(true);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) {
          const displayName = data.user.user_metadata?.display_name || email.split('@')[0];
          onLoginSuccess(displayName, data.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Greška pri prijavi.');
    }
    setLoading(false);
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setError('');
    setRegistered(false);
  };

  const inputCls = 'absolute bg-transparent text-white outline-none border-none text-base tracking-wide';

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <img src="/assets/login-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Logo — independent, floats above the popup */}
      <img
        src="/assets/login-logo.png"
        alt="LearnIT Logo"
        className="absolute z-20 h-48 object-contain"
        style={{ imageRendering: 'pixelated', top: '-8%', left: '50%', transform: 'translateX(-50%)' }}
        draggable={false}
      />

      <div className="relative z-10 flex flex-col items-center gap-2">

        <form
          onSubmit={handleSubmit}
          className="relative"
          style={{ width: 'min(1300px, 100vw)' }}
        >
          <img
            src={mode === 'login' ? '/assets/login-popup.png' : '/assets/register-popup.png'}
            alt="popup"
            className="w-full h-auto block"
            draggable={false}
          />

          {/* ── Tab: PRIJAVA ── */}
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="absolute cursor-pointer bg-transparent border-none"
            style={{ left: '39%', top: '19%', width: '11%', height: '8%' }}
          />

          {/* ── Tab: REGISTRACIJA ── */}
          <button
            type="button"
            onClick={() => switchMode('register')}
            className="absolute cursor-pointer bg-transparent border-none"
            style={{ left: '50%', top: '19%', width: '11%', height: '8%' }}
          />

          {mode === 'login' && (
            <>
              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputCls}
                style={{ left: '41%', top: '34%', width: '22%', height: '8%' }}
              />

              {/* Password */}
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                className={inputCls}
                style={{ left: '41%', top: '48%', width: '22%', height: '8%' }}
              />

              {/* Zapamti me checkbox */}
              <div
                onClick={() => setRememberMe(r => !r)}
                className="absolute cursor-pointer flex items-center justify-center"
                style={{ left: '39%', top: '61%', width: '2.5%', height: '5%' }}
              >
                {rememberMe && <span className="text-white font-bold" style={{ fontSize: '1.2em', lineHeight: 1 }}>✓</span>}
              </div>

              {/* Uđi u školu */}
              <button
                type="submit"
                disabled={loading}
                className="absolute cursor-pointer bg-transparent border-none"
                style={{ left: '39%', top: '71%', width: '22%', height: '11%' }}
              />
            </>
          )}

          {mode === 'register' && !registered && (
            <>
              {/* Ime */}
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                className={inputCls}
                style={{ left: '41%', top: '31%', width: '20%', height: '8%' }}
              />

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputCls}
                style={{ left: '41%', top: '42%', width: '20%', height: '8%' }}
              />

              {/* Password */}
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputCls}
                style={{ left: '41%', top: '53.5%', width: '20%', height: '8%' }}
              />

              {/* Zapamti me checkbox */}
              <div
                onClick={() => setRememberMe(r => !r)}
                className="absolute cursor-pointer flex items-center justify-center"
                style={{ left: '39%', top: '63%', width: '2.5%', height: '5%' }}
              >
                {rememberMe && <span className="text-white font-bold" style={{ fontSize: '1.2em', lineHeight: 1 }}>✓</span>}
              </div>

              {/* Uđi u školu */}
              <button
                type="submit"
                disabled={loading}
                className="absolute cursor-pointer bg-transparent border-none"
                style={{ left: '39%', top: '71%', width: '22%', height: '11%' }}
              />
            </>
          )}

          {mode === 'register' && registered && (
            <div
              className="absolute flex flex-col items-center justify-center text-center gap-2"
              style={{ left: '39%', top: '30%', width: '22%', height: '40%' }}
            >
              <p className="text-green-300 font-bold leading-tight">POTVRDI EMAIL!</p>
              <p className="text-white/70 text-xs leading-tight">Link poslat na<br />{email}</p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mt-2 px-3 py-1 bg-green-700/80 text-white text-xs border border-green-500"
              >
                PRIJAVI SE
              </button>
            </div>
          )}
        </form>

        {error && (
          <p className="text-red-400 text-xs text-center max-w-[280px] bg-black/60 px-3 py-1 rounded">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
