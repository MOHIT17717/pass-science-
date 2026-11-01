'use client';

import React from 'react';
import { Mail, User, ShieldCheck } from 'lucide-react';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-24 bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            TECHNICAL INQUIRIES & CONTACT
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Developer Contact
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            For technical inquiries, software verification inquiries, or architectural reviews regarding the Unified Engineering Workbench project, reach out directly via email.
          </p>
        </div>

        {/* Contact Card */}
        <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl backdrop-blur-xl">
          <div className="space-y-6">
            {/* Developer Name */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Developer & Author
                </div>
                <div className="text-xl font-bold text-white mt-0.5">
                  Mohit S K
                </div>
              </div>
            </div>

            {/* Primary Email */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Primary Email
                </div>
                <a
                  href="mailto:mohit17717@gmail.com"
                  className="text-base sm:text-lg font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  mohit17717@gmail.com
                </a>
              </div>
            </div>

            {/* College Email */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Institutional Email
                </div>
                <a
                  href="mailto:ms1131@srmist.edu.in"
                  className="text-base sm:text-lg font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ms1131@srmist.edu.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

