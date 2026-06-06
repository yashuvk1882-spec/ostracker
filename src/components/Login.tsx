/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, Chrome, Phone, Terminal, Compass, 
  ArrowRight, ShieldCheck, CheckSquare, KeyRound, Smartphone, AlertCircle, ExternalLink
} from 'lucide-react';
import { 
  isFirebaseReady, 
  getFirebaseAuth, 
  TrackerUser,
  signInWithPopup,
  googleProvider,
  microsoftProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
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
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneAuthError, setPhoneAuthError] = useState<boolean>(false);

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

  // Automated loading of interactive visible (normal size) google reCAPTCHA when phone option is selected
  useEffect(() => {
    if (activeMethod === 'phone' && !otpSent) {
      const initRecaptcha = async () => {
        const ready = isFirebaseReady();
        if (!ready) return;
        
        const authInstance = getFirebaseAuth();
        if (authInstance) {
          try {
            // Clean up any existing verifications to prevent Firebase reCAPTCHA duplicate render crash
            const container = document.getElementById('recaptcha-container');
            if (container) {
              container.innerHTML = '';
            }

            if ((window as any).recaptchaVerifier) {
              try {
                (window as any).recaptchaVerifier.clear();
              } catch (e) {}
              (window as any).recaptchaVerifier = null;
            }

            // Standardize to normal-sized visible checkbox. This lets users directly tick 'I am not a robot'
            // and clears any terms of service/taking action overlay alerts right inside the widget safely.
            (window as any).recaptchaVerifier = new RecaptchaVerifier(authInstance, 'recaptcha-container', {
              size: 'normal',
              callback: () => {
                console.info('reCAPTCHA solved successfully.');
              },
              'expired-callback': () => {
                showAlert('reCAPTCHA safety check expired. Please complete the verification click again.');
              }
            });
            
            await (window as any).recaptchaVerifier.render();
          } catch (err) {
            console.error("reCAPTCHA rendering issue: ", err);
          }
        }
      };

      const timerId = setTimeout(initRecaptcha, 150);
      return () => {
        clearTimeout(timerId);
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {}
          (window as any).recaptchaVerifier = null;
        }
      };
    }
  }, [activeMethod, otpSent]);

  // Google Login Handling
  const handleGoogleLogin = async () => {
    setLoading(true);
    const ready = isFirebaseReady();
    if (!ready) {
      showAlert('Workspace is disconnected from Firebase. Check firebase-applet-config.json.');
      setLoading(false);
      return;
    }

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
    }
  };

  // Microsoft Login Handling
  const handleMicrosoftLogin = async () => {
    setLoading(true);
    const ready = isFirebaseReady();
    if (!ready) {
      showAlert('Workspace is disconnected from Firebase. Check firebase-applet-config.json.');
      setLoading(false);
      return;
    }

    const authInstance = getFirebaseAuth();
    if (authInstance) {
      try {
        const result = await signInWithPopup(authInstance, microsoftProvider);
        const user = result.user;
        const sessionUser: TrackerUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Microsoft User',
          photoURL: user.photoURL,
          providerId: 'microsoft'
        };
        onLoginSuccess(sessionUser);
      } catch (err: any) {
        console.error(err);
        showAlert(err.message || 'Microsoft Authentication failed or popup closed.');
      } finally {
        setLoading(false);
      }
    }
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
    if (!ready) {
      showAlert('Workspace is disconnected from Firebase. Check firebase-applet-config.json.');
      setLoading(false);
      return;
    }
    
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
        showAlert(err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Phone triggers & Recaptcha OTP flow
  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length === 0) {
      showAlert('Please insert a valid mobile number.');
      return;
    }
    
    setLoading(true);
    
    // Normalize and validate Indian Phone Numbers (+91)
    const rawVal = phone.trim();
    const cleanNumbers = rawVal.replace(/[\s\-\(\)]/g, '');
    
    let isIndian = false;
    let finalPhone = '';

    if (cleanNumbers.startsWith('+91') && cleanNumbers.length === 13 && /^\+91[6-9]\d{9}$/.test(cleanNumbers)) {
      isIndian = true;
      finalPhone = cleanNumbers;
    } else if (cleanNumbers.startsWith('91') && cleanNumbers.length === 12 && /^91[6-9]\d{9}$/.test(cleanNumbers)) {
      isIndian = true;
      finalPhone = '+' + cleanNumbers;
    } else if (cleanNumbers.startsWith('0') && cleanNumbers.length === 11 && /^0[6-9]\d{9}$/.test(cleanNumbers)) {
      isIndian = true;
      finalPhone = '+91' + cleanNumbers.substring(1);
    } else if (cleanNumbers.length === 10 && /^[6-9]\d{9}$/.test(cleanNumbers)) {
      isIndian = true;
      finalPhone = '+91' + cleanNumbers;
    }

    if (!isIndian) {
      showAlert('Workspace Registration Error: For region compliance, please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).');
      setLoading(false);
      return;
    }

    // Set normalized phone back to state so UI shows the correct processed number
    setPhone(finalPhone);

    const ready = isFirebaseReady();
    if (!ready) {
      showAlert('Workspace is disconnected from Firebase. Verify configuration.');
      setLoading(false);
      return;
    }

    const authInstance = getFirebaseAuth();
    if (authInstance) {
      try {
        const verifier = (window as any).recaptchaVerifier;
        if (!verifier) {
          showAlert('Please wait for the Google reCAPTCHA safety checkbox to load, or tap on standard Gmail login.');
          setLoading(false);
          return;
        }
        
        const result = await signInWithPhoneNumber(authInstance, finalPhone, verifier);
        setConfirmationResult(result);
        setOtpSent(true);
        showAlert(`Secure verification SMS OTP code sent via Firebase to ${finalPhone}!`, false);
      } catch (err: any) {
        console.error(err);
        const errMsg = err.message || '';
        const isNotAllowed = err.code === 'auth/operation-not-allowed' || 
                             errMsg.includes('operation-not-allowed') || 
                             errMsg.includes('not-allowed');

        if (isNotAllowed) {
          setPhoneAuthError(true);
        } else {
          showAlert(errMsg || 'Verification failed. Please verify that the reCAPTCHA checkbox is checked, and try again.');
        }
        
        // Reset verifier to allow pristine retries
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {}
          (window as any).recaptchaVerifier = null;
        }
        // Force re-execution State to prevent lock-out
        setOtpSent(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      showAlert('Please enter the OTP verification code.');
      return;
    }
    setLoading(true);
    if (confirmationResult) {
      try {
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;
        onLoginSuccess({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Mobile Member',
          photoURL: user.photoURL,
          providerId: 'phone',
          phoneNumber: user.phoneNumber
        });
      } catch (err: any) {
        console.error(err);
        showAlert(err.message || 'Incorrect verification code. Please request a new code.');
      } finally {
        setLoading(false);
      }
    } else {
      showAlert('Session expired. Please request a new verification SMS.', true);
      setLoading(false);
    }
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
            onClick={() => { setActiveMethod('email'); setErrorMsg(null); setPhoneAuthError(false); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'email' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail</span>
          </button>
          <button
            onClick={() => { setActiveMethod('phone'); setErrorMsg(null); setPhoneAuthError(false); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'phone' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => { setActiveMethod('google'); setErrorMsg(null); setPhoneAuthError(false); }}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 ${activeMethod === 'google' ? 'bg-slate-750 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Chrome className="w-3.5 h-3.5" />
            <span>Google</span>
          </button>
          <button
            onClick={() => { setActiveMethod('microsoft'); setErrorMsg(null); setPhoneAuthError(false); }}
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
              {phoneAuthError ? (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-3 animate-fade-in" id="phone-console-instructions">
                  <div className="flex gap-2 text-orange-400 font-bold items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Firebase Phone Sign-In Disabled</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-semibold">
                    The Phone Auth Provider has not been toggled on inside your Firebase Project's console. To resolve this error:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-200">
                    <li className="font-medium">
                      Open your dedicated{' '}
                      <a 
                        href="https://console.firebase.google.com/project/gen-lang-client-0802511355/authentication/providers"
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-teal-400 font-black underline inline-flex items-center gap-0.5 hover:text-teal-300"
                        id="firebase-console-btn"
                      >
                        Firebase Sign-In Method Panel
                        <ExternalLink className="w-3.5 h-3.5 inline ml-0.5" />
                      </a>
                    </li>
                    <li className="font-medium">
                      Click <strong>"Add new provider"</strong>, choose <strong>"Phone"</strong>, turn the switch to <strong>Enabled</strong>, and press <strong>Save</strong>.
                    </li>
                  </ol>
                  <div className="pt-3 border-t border-slate-700/60 mt-3 text-[10px] text-slate-400">
                    <p className="mb-1 font-bold text-amber-300">💡 No Console access? Use default fallback:</p>
                    <p>
                      Click the <strong>Gmail tab</strong> at the top to complete and create your account instantly. It works immediately without any manual configuration changes!
                    </p>
                  </div>
                  <button
                    onClick={() => setPhoneAuthError(false)}
                    className="w-full text-center py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  >
                    Dismiss & Try Phone Number Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Invisible Recaptcha Anchor */}
                  <div id="recaptcha-container" className="my-1 text-center" />

                  {!otpSent ? (
                    <form onSubmit={handlePhoneSendOtp} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Indian Mobile Number</label>
                        <div className="relative flex">
                          <input 
                            type="tel" 
                            placeholder="e.g. 98765 43210 or +91 98765 43210"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 outline-none focus:border-teal-500 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        We will dispatch a secure SMS verification code via Firebase. Currently restricted to <span className="text-teal-400 font-bold">Indian Mobile Networks (+91)</span> for academic compliance check.
                      </p>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-sky-600 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:bg-sky-500 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Smartphone className="w-4 h-4" />
                        {loading ? 'Sending Code...' : 'Get SMS Verification Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handlePhoneVerifyOtp} className="space-y-3" id="phone-otp-form">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confirmation Code (6-digit OTP)</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-center text-sm font-black tracking-widest text-slate-100 outline-none focus:border-teal-500 transition-colors"
                          required
                        />
                      </div>

                      <p className="text-[10px] text-slate-400 text-center font-medium">
                        Enter the 6-digit confirmation code sent to your phone.
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
                </>
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
