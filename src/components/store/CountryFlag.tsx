import React, { useState } from 'react';
import { Globe } from 'lucide-react';

interface CountryFlagProps {
  iso?: string;
  flag?: string;
  name: string;
  size?: 'sm' | 'md';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ iso, flag, name, size = 'md' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const cleanIso = (iso || '').trim().toUpperCase();
  const hasIso = /^[A-Z]{2}$/.test(cleanIso);

  const dims = size === 'sm' ? 'w-6 h-4' : 'w-8 h-6';

  if (hasIso && !imgFailed) {
    return (
      <img
        src={`https://flagcdn.com/w80/${cleanIso.toLowerCase()}.png`}
        alt={`${name} flag`}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`${dims} rounded-[4px] object-cover border border-slate-200 bg-slate-100 shrink-0 shadow-2xs`}
      />
    );
  }

  if (flag && flag !== '🌐' && flag !== '📱') {
    return (
      <span className="text-xl leading-none shrink-0" aria-hidden="true">
        {flag}
      </span>
    );
  }

  return (
    <span
      className={`${dims} rounded-[4px] border border-slate-200 bg-slate-100 text-slate-600 text-[10px] font-mono font-bold inline-flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      {hasIso ? cleanIso : <Globe className="w-3.5 h-3.5 text-slate-500" />}
    </span>
  );
};
