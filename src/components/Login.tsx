import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Lock, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Standard username: Admin, Password: admin123
    setTimeout(() => {
      if (username === 'Admin' && password === 'Widya1*') {
        onLogin();
      } else {
        setError('Username atau password salah.');
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-50">
      {/* Background Decor - Kombinasi Lime & Emerald Blur */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime-300/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-[2rem] p-8 md:p-12 shadow-2xl border border-white/40">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-4">
              <img 
                src="/logo.png" 
                alt="Logo TM Generator" 
                className="w-full h-full object-contain" 
              />
            </div>
            {/* Teks judul menggunakan warna Emerald Tua untuk keterbacaan yang baik */}
            <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">TM GENERATOR</h1>
            <p className="text-lime-700 font-semibold text-sm mt-1">AI Modul Ajar Generator</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-emerald-900 ml-1">Username</label>
              <div className="relative">
                {/* Icon menggunakan warna Emerald */}
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  {/* Focus ring diubah menjadi warna lime/emerald */}
                  className="w-full bg-white/60 border border-emerald-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all placeholder:text-emerald-300 text-emerald-950"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-emerald-900 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full bg-white/60 border border-emerald-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all placeholder:text-emerald-300 text-emerald-950"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-sm font-medium text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Tombol Login Gradient Lime ke Emerald */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full bg-gradient-to-r from-lime-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-emerald-600 font-semibold tracking-wide uppercase">
            Professional Edition
          </p>
        </div>
      </motion.div>
    </div>
  );
}
