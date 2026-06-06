/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, Chrome, Phone, Terminal, Compass, 
  ArrowRight, ShieldCheck, CheckSquare, KeyRound, Smartphone, AlertCircle
} from 'lucide-react';
import { 
  isFirebaseReady, 
  getFirebaseAuth, 
  TrackerUser,
  signInWithPopup,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from '../utils/firebase';

interface LoginProps {
  onLoginSuccess: (user: TrackerUser) => void;
  onSkip: () => void;
}

type AuthMethod = 'email' | 'phone' | 'google' | 'microsoft';

export default function Login({ onLoginSuccess, onSkip }: LoginProps) {
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Trigger feedback messages
  const showAlert = (msg: string, isError = true) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 5000);
  };

  // Google Login Handling
  const handleGoogleLogin = async () => {
    setLoading(true);
    const ready = isFirebaseReady();
    if (ready) {
      const authInstance = getFirebaseAuth();
      if (authInstance) {
        try {
          const result = await signInWithPopup(authInstance, googleProvider);
          const user = result.user;
          const sessionUser: TrackerUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            providerId: 'google'
          };
          onLoginSuccess(sessionUser);
        } catch (err: any) {
          console.error(err);
          showAlert(err.message || 'Google Auth Popup closed or failed.');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // Sandbox Mock Login fallback
    setTimeout(() => {
      const mockUser: TrackerUser = {
        uid: 'mock-google-123',
        email: 'alex.scholar@gmail.com',
        displayName: 'Google User Alex',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
        providerId: 'google'
      };
      onLoginSuccess(mockUser);
      setLoading(false);
    }, 900);
  };

  // Microsoft Login Handling
  const handleMicrosoftLogin = () => {
    setLoading(true);
    // Microsoft login simulation or dynamic redirection
    setTimeout(() => {
      const mockUser: TrackerUser = {
        uid: 'mock-ms-987',
        email: 'alex.systems@outlook.com',
        displayName: 'Alex Microsoft Scholar',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
        providerId: 'microsoft'
      };
      onLoginSuccess(mockUser);
      setLoading(false);
    }, 1000);
  };

  // Gmail (Email/Password) Handling
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showAlert('Please fill in all details.');
      return;
    }
    if (password.length < 6) {
      showAlert('Password must represent at least 6 characters.');
      return;
    }

    setLoading(true);
    const ready = isFirebaseReady();
    
    if (ready) {
      const authInstance = getFirebaseAuth();
      if (authInstance) {
        try {
          if (isSignUp) {
            const res = await createUserWithEmailAndPassword(authInstance, email, password);
            const user = res.user;
            onLoginSuccess({
              uid: user.uid,
              email: user.email,
              displayName: fullName || 'Academic Scholar',
              photoURL: null,
              providerId: 'email'
            });
          } else {
            const res = await signInWithEmailAndPassword(authInstance, email, password);
            const user = res.user;
            onLoginSuccess({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Academic Scholar',
              photoURL: null,
              providerId: 'email'
            });
          }
        } catch (err: any) {
          console.error(err);
          showAlert(err.message || 'Authentication failed. Review credentials.');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // High fidelity Sandbox Local Fallback
    setTimeout(() => {
      try {
        const localAccountsRaw = localStorage.getItem('daily_tracker_sandbox_accounts') || '[]';
        const accounts = JSON.parse(localAccountsRaw);

        if (isSignUp) {
          // Check if account already exists
          const exists = accounts.find((a: any) => a.email.toLowerCase() === email.toLowerCase());
          if (exists) {
            showAlert('Register failed: An account with this Gmail already exists.');
            setLoading(false);
            return;
          }
          // Register
          const newAcc = { email, password, name: fullName || 'Alex Scholar' };
          accounts.push(newAcc);
          localStorage.setItem('daily_tracker_sandbox_accounts', JSON.stringify(accounts));
          
          showAlert('Sign up successful inside sandbox!', false);
          setTimeout(() => {
            onLoginSuccess({
              uid: `mock-email-${Date.now()}`,
              email: email,
              displayName: fullName || 'Alex Scholar',
              photoURL: null,
              providerId: 'email'
            });
          }, 800);
        } else {
          // Sign in
          const account = accounts.find(
            (a: any) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
          );
          if (account) {
            onLoginSuccess({
              uid: `mock-email-${Date.now()}`,
              email: account.email,
              displayName: account.name,
              photoURL: null,
              providerId: 'email'
            });
          } else {
            // Default sandbox mock login
            if (email === 'demo@gmail.com' && password === '123456') {
              onLoginSuccess({
                uid: 'mock-demo-user',
                email: 'demo@gmail.com',
                displayName: 'Demo Scholar',
                photoURL: null,
                providerId: 'email'
              });
            } else {
              showAlert('Invalid email or password. Use demo@gmail.com / 123456 to bypass or sign up.');
            }
          }
        }
      } catch (e) {
        showAlert('Local sandbox session failure. Please click guest access.');
      } finally {
        setLoading(false);
      }
    }, 1100);
  };

  // Phone triggers & OTP simulation
  const handlePhoneSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      showAlert('Please insert a valid mobile directory number.');
      return;
    }
    setLoading(true);
    // Simulate secure OTP delivery code triggering
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
      showAlert('Simulated verification OTP SMS code sent: [ 8 8 2 4 ]', false);
    }, 1200);
  };

  const handlePhoneVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '8824' && otpCode !== '1234') {
      showAlert('Invalid OTP confirmation pin code. Use verification code "8824".');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const mockUser: TrackerUser = {
        uid: 'mock-phone-' + phone.replace(/\D/g, ''),
        email: null,
        displayName: 'Mobile Member',
        photoURL: null,
        providerId: 'phone',
        phoneNumber: phone
      };
      onLoginSuccess(mockUser);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans" id="auth-portal-viewport">
      {/* Background visual graphics */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.07),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.06),transparent_50%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800/80 border border-slate-700/60 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8"
        id="auth-form-card"
      >
        {/* Title branding header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-900 font-extrabold shadow-lg shadow-teal-500/20">
            <CheckSquare className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase text-teal-400">Pristine Daily Life Space</h1>
            <p className="text-xs text-slate-400">Timetable Scheduler, Health Tracker & Milestones</p>
          </div>
        </div>

        {/* Success/Error Toasts */}
        <AnimatePresence mode="popLayout">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2"
              id="auth-error-toast"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 mb-4 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2"
              id="auth-success-toast"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Methods Nav Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/40 rounded-xl mb-6" id="auth-method-tab-bar">
          <button
            onClick={() => { setActiveMethod('email'); setErrorMsg(null); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'email' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail</span>
          </button>
          <button
            onClick={() => { setActiveMethod('phone'); setErrorMsg(null); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'phone' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => { setActiveMethod('google'); setErrorMsg(null); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'google' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Chrome className="w-3.5 h-3.5" />
            <span>Google</span>
          </button>
          <button
            onClick={() => { setActiveMethod('microsoft'); setErrorMsg(null); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'microsoft' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>MS Office</span>
          </button>
        </div>

        {/* Main interactive form */}
        <div className="space-y-4">
          {/* Method 1: Email Password Form */}
          {activeMethod === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3" id="email-signin-form">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. Alex"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-3 pr-2 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 outline-none focus:border-teal-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">My Gmail Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="e.g. user@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-3 pr-2 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 outline-none focus:border-teal-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-3 pr-2 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 outline-none focus:border-teal-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl hover:bg-teal-400 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading ? 'Authenticating System...' : isSignUp ? 'Sign Up for Space' : 'Sign In Now'}
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[10px] text-teal-400 font-bold hover:underline"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account or Gmail sign up? Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Method 2: Phone Authentication Flow */}
          {activeMethod === 'phone' && (
            <div className="space-y-4" id="phone-auth-panel">
              {!otpSent ? (
                <form onSubmit={handlePhoneSendOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mobile Number</label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700 bg-slate-950 text-slate-400 text-xs font-mono">
                        +1
                      </span>
                      <input 
                        type="tel" 
                        placeholder="(555) 000-0000"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-3 pr-2 py-2 bg-slate-900 border border-slate-700/80 rounded-r-xl text-xs text-slate-100 outline-none focus:border-teal-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    We will dispatch a secure 4-digit code to simulate the phone login OTP pipeline securely.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-sky-600 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:bg-sky-500 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4" />
                    {loading ? 'Sending Code...' : 'Get Simulation Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneVerifyOtp} className="space-y-3" id="phone-otp-form">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confirmation Code (OTP)</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      placeholder="Type e.g. 8824"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-center text-sm font-black tracking-widest text-slate-100 outline-none focus:border-teal-500 transition-colors"
                      required
                    />
                  </div>

                  <p className="text-[10px] text-teal-400 text-center font-bold">
                    Hint: Use simulation OTP verification passcode "8824" or "1234".
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 py-2 px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-2.5 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-emerald-500 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Verify & Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Method 3: Google Login */}
          {activeMethod === 'google' && (
            <div className="space-y-4 py-3 text-center" id="google-auth-panel">
              <p className="text-xs text-slate-300">
                Authorize safe entry via Google Account Credentials using high-speed authentication.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-200 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
              >
                <Chrome className="w-4 h-4 text-red-400" />
                <span>{loading ? 'connecting credentials...' : 'Authenticate Google'}</span>
              </button>

              <div className="text-[10px] text-slate-500 font-medium">
                Uses real browser popup authorization if Firestore keys are synced.
              </div>
            </div>
          )}

          {/* Method 4: Microsoft Authenticator */}
          {activeMethod === 'microsoft' && (
            <div className="space-y-4 py-3 text-center" id="ms-auth-panel">
              <p className="text-xs text-slate-300">
                Sign up using your Microsoft Personal, Work, or School Live directories smoothly.
              </p>

              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full py-3 bg-blue-600/15 hover:bg-blue-600/25 text-blue-200 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>{loading ? 'contacting microsoft...' : 'Microsoft Sign In'}</span>
              </button>

              <div className="text-[10px] text-slate-500">
                Perfect for syncing academic calendar profiles.
              </div>
            </div>
          )}
        </div>

        {/* Guest Skip Action */}
        <div className="mt-6 pt-5 border-t border-slate-700/50 flex flex-col items-center gap-2.5">
          <p className="text-[10px] text-slate-400">Want to run immediately without logging in?</p>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-1.5 bg-slate-700/60 hover:bg-slate-700 hover:text-white text-slate-300 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition"
            id="auth-skip-guest-btn"
          >
            <Compass className="w-3.5 h-3.5" /> Skip & Study Guest Mode
          </button>
        </div>
      </motion.div>
      
      {/* Dev / Vercel notes overlay */}
      <p className="mt-4 text-[10px] text-slate-500 text-center select-none font-mono tracking-wide max-w-sm">
        Vercel Application Environment • Features full browser LocalStorage support + optional live database syncing.
      </p>
    </div>
  );
}
