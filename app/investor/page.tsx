'use client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { WalletButton } from '@/components/WalletButton';
import { getLoans, type Loan } from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:     'bg-green-500/20 text-green-400',
  REPAID:     'bg-blue-500/20  text-blue-400',
  LIQUIDATED: 'bg-red-500/20   text-red-400',
};

export default function InvestorPage() {
  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: getLoans,
    refetchInterval: 15_000,
  });

  const handleFund = async (loan: Loan) => {
    toast('Fund flow: sign transaction with Freighter then POST /api/invoices/:id/fund', {
      icon: '🔏',
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1a0f] text-white font-['Inter']">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-green-900/40">
        <span className="font-['Outfit'] font-bold text-xl text-green-400">🐄 StellarKraal</span>
        <WalletButton />
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-['Outfit'] text-4xl font-bold text-white">Loan Marketplace</h1>
          <p className="text-gray-500 mt-1">Fund livestock-backed loans and earn yield</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl bg-green-900/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-green-900/40">
            <table className="w-full text-sm">
              <thead className="bg-green-900/20 text-gray-400 text-left">
                <tr>
                  {['Animal', 'Breed', 'Appraised Value', 'Loan Amount', 'LTV', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900/30">
                {(loans ?? []).map(loan => {
                  const appraised = Number(loan.livestock?.appraisedValue ?? 0) / 10_000_000;
                  const principal = Number(loan.principal) / 10_000_000;
                  const ltv = appraised > 0 ? ((principal / appraised) * 100).toFixed(0) : '—';

                  return (
                    <tr key={loan.id} className="hover:bg-green-900/10 transition-colors">
                      <td className="px-5 py-4 text-white capitalize">{loan.livestock?.animalType}</td>
                      <td className="px-5 py-4 text-gray-400">{loan.livestock?.breed}</td>
                      <td className="px-5 py-4 text-green-400 font-mono">${appraised.toFixed(2)}</td>
                      <td className="px-5 py-4 text-amber-400 font-mono">${principal.toFixed(2)}</td>
                      <td className="px-5 py-4 text-gray-400">{ltv}%</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[loan.status] ?? 'bg-gray-800 text-gray-400'}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {loan.status === 'ACTIVE' && (
                          <button
                            id={`btn-fund-${loan.id}`}
                            onClick={() => handleFund(loan)}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-xs font-semibold text-black transition-all hover:scale-105"
                          >
                            Fund Loan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
