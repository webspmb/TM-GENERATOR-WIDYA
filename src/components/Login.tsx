import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Lock, User, Sparkles, RotateCw } from 'lucide-react';
import { cn } from '../lib/utils';

const LoginIllustration = () => (
  <svg viewBox="0 0 400 320" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Floating background decorative blobs */}
    <circle cx="80" cy="70" r="50" fill="#ffedd5" opacity="0.6" />
    <circle cx="320" cy="240" r="60" fill="#dcfce7" opacity="0.6" />
    <circle cx="340" cy="80" r="40" fill="#fef9c3" opacity="0.5" />

    {/* Desk Surface (Subtle line) */}
    <path d="M40 280 H360" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

    {/* Computer Stand */}
    <path d="M185 240 L170 280 H230 L215 240 Z" fill="#cbd5e1" />
    <path d="M165 280 H235" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

    {/* Main Monitor Frame */}
    <rect x="80" y="50" width="240" height="155" rx="16" fill="#1e293b" />
    {/* Screen Glass */}
    <rect x="90" y="60" width="220" height="135" rx="8" fill="#ffffff" />

    {/* Screen Content: Educational Dashboard */}
    {/* Sidebar */}
    <rect x="95" y="65" width="40" height="125" rx="4" fill="#f8fafc" />
    <rect x="100" y="75" width="30" height="8" rx="2" fill="#f97316" opacity="0.8" />
    <rect x="100" y="90" width="25" height="6" rx="2" fill="#94a3b8" />
    <rect x="100" y="102" width="25" height="6" rx="2" fill="#94a3b8" />
    <rect x="100" y="114" width="25" height="6" rx="2" fill="#94a3b8" />
    <rect x="100" y="126" width="25" height="6" rx="2" fill="#94a3b8" />

    {/* Header of Dashboard inside screen */}
    <rect x="140" y="65" width="165" height="18" rx="4" fill="#f8fafc" />
    <circle cx="150" cy="74" r="5" fill="#f59e0b" />
    <rect x="160" y="71" width="50" height="6" rx="2" fill="#e2e8f0" />
    <rect x="275" y="70" width="25" height="8" rx="4" fill="#10b981" />

    {/* Main Area: Widgets */}
    {/* 1. Main Welcome/Feature Card in Green */}
    <rect x="140" y="88" width="165" height="42" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
    <rect x="148" y="96" width="100" height="8" rx="2" fill="#10b981" />
    <rect x="148" y="108" width="130" height="5" rx="2" fill="#a7f3d0" />
    <rect x="148" y="117" width="80" height="5" rx="2" fill="#a7f3d0" />
    
    {/* Star badge in top right of green card */}
    <path d="M285 94 L286.5 97.5 L290 98 L287.5 100.5 L288 104 L285 102 L282 104 L282.5 100.5 L280 98 L283.5 97.5 Z" fill="#f59e0b" />

    {/* 2. Chart Widget (Orange and Yellow bars) */}
    <rect x="140" y="136" width="78" height="48" rx="6" fill="#fffaf5" stroke="#f97316" strokeWidth="1" />
    <rect x="148" y="144" width="45" height="6" rx="2" fill="#f97316" />
    {/* Bar chart graphics */}
    <rect x="148" y="158" width="10" height="18" rx="2" fill="#f97316" />
    <rect x="162" y="154" width="10" height="22" rx="2" fill="#f59e0b" />
    <rect x="176" y="162" width="10" height="14" rx="2" fill="#10b981" />
    <rect x="190" y="150" width="10" height="26" rx="2" fill="#eab308" />

    {/* 3. Small Tasks Widget */}
    <rect x="224" y="136" width="81" height="48" rx="6" fill="#fefce8" stroke="#eab308" strokeWidth="1" />
    <rect x="232" y="144" width="40" height="6" rx="2" fill="#eab308" />
    {/* Bullet items */}
    <circle cx="235" cy="158" r="3" fill="#10b981" />
    <rect x="242" y="156" width="50" height="4" rx="2" fill="#cbd5e1" />
    
    <circle cx="235" cy="168" r="3" fill="#cbd5e1" />
    <rect x="242" y="166" width="45" height="4" rx="2" fill="#e2e8f0" />

    {/* Laptop Floating Beside it to make it modern */}
    <g transform="translate(45, 160) scale(0.65)">
      {/* Laptop Monitor */}
      <rect x="30" y="40" width="110" height="74" rx="8" fill="#475569" />
      <rect x="35" y="45" width="100" height="60" rx="4" fill="#ffffff" />
      {/* Dashboard on laptop */}
      <rect x="40" y="52" width="40" height="45" rx="3" fill="#ffedd5" />
      <rect x="85" y="52" width="45" height="20" rx="3" fill="#dcfce7" />
      <rect x="85" y="77" width="45" height="20" rx="3" fill="#fef9c3" />
      {/* Laptop Base */}
      <rect x="10" y="113" width="150" height="8" rx="4" fill="#cbd5e1" />
      <rect x="15" y="114" width="140" height="4" rx="2" fill="#94a3b8" />
    </g>

    {/* Floating Book Decor */}
    <g transform="translate(290, 180) scale(0.7)">
      <rect x="20" y="20" width="30" height="40" rx="2" fill="#f97316" />
      <rect x="16" y="24" width="30" height="40" rx="2" fill="#10b981" />
      <rect x="19" y="24" width="24" height="36" fill="#ffffff" />
      <line x1="23" y1="32" x2="39" y2="32" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      <line x1="23" y1="40" x2="39" y2="40" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      <line x1="23" y1="48" x2="35" y2="48" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Floating Pencil Decor */}
    <g transform="translate(325, 140) rotate(45) scale(0.6)">
      <rect x="10" y="10" width="8" height="45" rx="2" fill="#eab308" />
      <path d="M10 55 L14 62 L18 55 Z" fill="#ffedd5" />
      <path d="M13 60 L14 62 L15 60 Z" fill="#1e293b" />
      <rect x="10" y="8" width="8" height="4" fill="#f43f5e" />
    </g>
  </svg>
);

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security code / Captcha logic
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    setCaptchaCode(generateCaptcha());
  }, []);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate security code (case insensitive)
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Kode pengaman tidak cocok. Silakan coba lagi.');
      handleRefreshCaptcha();
      setIsSubmitting(false);
      return;
    }

    // Standard username: Admin, Password: admin123 (Rahasia1*)
    setTimeout(() => {
      if (username === 'Admin' && password === 'Widya1*') {
        onLogin();
      } else {
        setError('Username atau password salah.');
        handleRefreshCaptcha();
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-white">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-200/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-green-200/35 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md md:max-w-4xl relative z-10"
      >
        <div className="glass rounded-[2rem] p-6 md:p-8 shadow-2xl border border-orange-100 bg-white/90 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Computer Illustration */}
            <div className="hidden md:flex md:col-span-6 flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 via-amber-50/40 to-green-50/50 rounded-[1.5rem] border border-orange-100/60 min-h-[480px]">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-[10px] font-bold tracking-widest uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> CIPTA AJAR SUIT
                </div>
                <h2 className="text-2xl font-black text-slate-800">Transformasi Perangkat Ajar</h2>
                <p className="text-slate-600 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Sistem digital cerdas terintegrasi Kurikulum Merdeka untuk menyusun Modul Ajar/Kokurikuler, dan Asesmen Secara Mandiri.
                </p>
              </div>
              
              <div className="w-full max-w-[280px] hover:scale-105 transition-transform duration-300">
                <LoginIllustration />
              </div>

              <div className="mt-8 flex gap-4 text-[10px] text-slate-400 font-medium">
                <span>⚡ Cepat & Akurat</span>
                <span>•</span>
                <span>🔒 Aman & Terpercaya</span>
                <span>•</span>
                <span>🎯 Berbasis Standar</span>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="col-span-1 md:col-span-6 flex flex-col justify-center py-2 px-1">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 mb-3 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-inner border border-orange-200/50">
                  <img 
                    src={localStorage.getItem('ciptajar_custom_logo') || "/logo.png"} 
                    alt="Logo Cipta Ajar Suit" 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 via-amber-500 to-green-600 bg-clip-text text-transparent">CIPTA AJAR SUIT</h1>
                <p className="text-green-700 font-semibold text-xs mt-0.5">Mudahnya Merancang Masa Depan Kelas</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-orange-800 ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan Username"
                      className="w-full bg-white/50 border border-green-200 rounded-2xl py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-orange-800 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan Password"
                      className="w-full bg-white/50 border border-green-200 rounded-2xl py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Security Code Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-orange-800 ml-1">Kode Pengaman</label>
                  <div className="flex gap-2 items-center">
                    {/* Visual Code */}
                    <div 
                      onClick={handleRefreshCaptcha}
                      title="Klik untuk memuat ulang kode pengaman"
                      className="flex-1 bg-gradient-to-r from-orange-50 to-green-50/50 py-2.5 px-3 rounded-2xl border border-orange-200/50 flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="font-mono text-base font-extrabold tracking-widest text-slate-700 line-through decoration-orange-400/60 skew-x-12 select-none select-none">
                        {captchaCode}
                      </span>
                      <RotateCw className="w-3.5 h-3.5 text-orange-600 hover:rotate-180 transition-transform duration-300" />
                    </div>

                    {/* Input */}
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Ketik kode"
                      className="w-[120px] bg-white/50 border border-green-200 rounded-2xl py-2.5 px-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-xs text-center font-mono font-bold text-slate-800 uppercase"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic ml-1">Ketik kode di atas secara bebas (huruf besar/kecil sama saja)</p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-xs font-bold text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full bg-gradient-to-r from-orange-500 via-amber-400 to-green-600 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 text-xs",
                    isSubmitting && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Login
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-[10px] text-orange-500 font-bold tracking-wide uppercase">
                Profesional Edition
              </p>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
