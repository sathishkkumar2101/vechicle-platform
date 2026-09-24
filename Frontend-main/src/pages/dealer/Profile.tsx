import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { initials } from '../../lib/format';

import { useState, useEffect } from 'react';
import type { Dealer } from '../../types';
import api from '../../lib/api';

export default function DealerProfile() {
  const { user } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);

  useEffect(() => {
    if (user?.id) {
      api.get<Dealer>('/dealers/' + user.id).then(setDealer).catch(() => {});
    }
  }, [user]);

  return (
    <div>
      <PageHeader title="Dealer Profile" subtitle="Your dealership information" breadcrumbs={[{ label: 'Dealer' }, { label: 'Profile' }]} />
      <div className="max-w-2xl space-y-5">
        {/* Dealer card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center">
              <span className="font-display text-xl font-bold text-amber-400">PM</span>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-white">{dealer?.name}</p>
              <p className="text-sm text-zinc-500">{dealer?.city}, {dealer?.state}</p>
              {dealer?.rating && (
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(dealer?.rating!) ? 'text-amber-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="text-xs text-zinc-500 ml-1 font-mono">{dealer?.rating}</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Address', value: dealer?.address },
              { label: 'City', value: `${dealer?.city}, ${dealer?.state} ${dealer?.zipCode}` },
              { label: 'Phone', value: dealer?.phone },
              { label: 'Email', value: dealer?.email },
              { label: 'Total Inventory', value: `${dealer?.totalVehicles} vehicles` },
            ].map(item => (
              <div key={item.label} className="bg-zinc-950/50 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className="text-sm text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
          <p className="font-display text-sm font-semibold text-white mb-4 uppercase tracking-wider">Account</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
              <span className="text-sm font-medium text-zinc-400">{initials(user?.name,)}</span>
            </div>
            <div>
              <p className="text-sm text-white">{user?.name}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
