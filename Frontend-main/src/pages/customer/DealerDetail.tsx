import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import api from '../../lib/api';
import type { Dealer } from '../../types';

export default function DealerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<Dealer>(`/dealers/${id}`)
      .then(setDealer)
      .catch(() => setDealer(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dealers' }]}
        title={loading ? '—' : dealer?.name ?? 'Dealer'}
        actions={<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>}
      />

      {loading ? (
        <div className="max-w-lg space-y-4">
          <Skeleton className="h-48 rounded" />
        </div>
      ) : dealer ? (
        <div className="max-w-lg space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-white">{dealer.name}</p>
                <p className="text-sm text-zinc-500">{dealer.location || [dealer.city, dealer.state].filter(Boolean).join(', ') || 'Authorized Dealer'}</p>
                {dealer.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(dealer.rating!) ? 'text-amber-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span className="text-xs text-zinc-400 ml-1">{dealer.rating}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Address', value: dealer.location || [dealer.address, dealer.city, dealer.state, dealer.zipCode].filter(Boolean).join(', ') || 'Authorized Dealership Center' },
                { label: 'Phone', value: dealer.phone || '+1 (800) 555-BMW1' },
                { label: 'Email', value: dealer.email || `contact@${dealer.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` },
                { label: 'Inventory', value: dealer.totalVehicles ? `${dealer.totalVehicles} vehicles available` : undefined },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex items-start gap-3 text-sm">
                  <span className="text-zinc-600 w-20 shrink-0">{item.label}</span>
                  <span className="text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={() => navigate('/customer/appointments/book')}>Schedule Visit</Button>
        </div>
      ) : null}
    </div>
  );
}
