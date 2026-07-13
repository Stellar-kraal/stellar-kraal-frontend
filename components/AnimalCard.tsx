'use client';
import type { LivestockItem } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  VERIFIED: 'bg-green-500/20 text-green-400 border-green-500/30',
  PENDING:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOCKED:   'bg-blue-500/20  text-blue-400  border-blue-500/30',
};

export function AnimalCard({ animal }: { animal: LivestockItem }) {
  const usdcValue = (Number(animal.appraisedValue) / 10_000_000).toFixed(2);
  const emoji = animal.animalType.toLowerCase() === 'cattle' ? '🐄'
              : animal.animalType.toLowerCase() === 'goat'   ? '🐐'
              : '🐑';

  return (
    <article className="group relative bg-[#111a11] border border-green-900/40 rounded-2xl p-5 hover:border-green-600/60 hover:shadow-lg hover:shadow-green-900/30 transition-all duration-300">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="font-['Outfit'] font-bold text-white text-lg">
        {animal.breed} {animal.animalType}
      </h3>
      <p className="text-gray-500 text-sm mt-1">
        {animal.weightKg} kg · {animal.ageMonths} months
      </p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-green-400 font-mono font-semibold text-lg">
          ${usdcValue} <span className="text-xs text-gray-500">USDC</span>
        </p>
        <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLES[animal.verificationStatus] ?? 'bg-gray-800 text-gray-400 border-gray-600'}`}>
          {animal.verificationStatus}
        </span>
      </div>
      {animal.txHash && (
        <p className="mt-3 text-xs text-gray-600 font-mono truncate">
          TX: {animal.txHash}
        </p>
      )}
    </article>
  );
}
