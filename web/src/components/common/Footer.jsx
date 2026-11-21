import React from 'react';
import { Pill, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Pill className="w-3.5 h-3.5 transform -rotate-45" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Meditrace</span>
            <span className="text-slate-400">| Complete Healthcare & Medicine Management</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Drug Licence Verified Retailers</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span>Built with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
              <span>for Patient Health</span>
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-slate-400 text-[11px]">
          © {new Date().getFullYear()} Meditrace. Tracking aid and healthcare companion. All dummy transactions run in secure test mode.
        </div>
      </div>
    </footer>
  );
}
