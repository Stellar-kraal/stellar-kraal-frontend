'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { WalletButton } from '@/components/WalletButton';
import { AnimalCard } from '@/components/AnimalCard';
import { getMyKraal, registerAnimal, type AnimalInput } from '@/lib/api';

const HEALTH_OPTIONS = ['HEALTHY', 'FAIR', 'POOR'] as const;
const SPECIES_OPTIONS = ['cattle', 'goat', 'sheep', 'pig'] as const;

export default function FarmerDashboard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AnimalInput>({
    animalType: 'cattle', breed: '', weightKg: 250,
    ageMonths: 36, healthStatus: 'HEALTHY', rfidTag: '',
  });

  const { data: kraal, isLoading } = useQuery({
    queryKey: ['my-kraal'],
    queryFn: getMyKraal,
    retry: false,
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: registerAnimal,
    onSuccess: (res) => {
      toast.success(`Animal registered! Appraised at $${res.summary.grossValueUSDC} USDC`);
      qc.invalidateQueries({ queryKey: ['my-kraal'] });
      setShowModal(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-[#0f1a0f] text-white font-['Inter']">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-green-900/40">
        <span className="font-['Outfit'] font-bold text-xl text-green-400">🐄 StellarKraal</span>
        <WalletButton />
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Outfit'] text-4xl font-bold text-white">My Kraal</h1>
            <p className="text-gray-500 mt-1">Your registered livestock collateral</p>
          </div>
          <button
            id="btn-register-animal"
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold text-white transition-all hover:scale-105"
          >
            + Register Animal
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-green-900/20 animate-pulse" />
            ))}
          </div>
        ) : kraal && kraal.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {kraal.map(a => <AnimalCard key={a.id} animal={a} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">
            <p className="text-6xl mb-4">🐄</p>
            <p>No animals registered yet. Add your first animal to get started.</p>
          </div>
        )}
      </main>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111a11] border border-green-800/50 rounded-2xl p-8 w-full max-w-md">
            <h2 className="font-['Outfit'] text-2xl font-bold text-white mb-6">Register Animal</h2>
            <div className="space-y-4">
              <label className="block text-sm text-gray-400">
                Species
                <select
                  id="select-species"
                  value={form.animalType}
                  onChange={e => setForm(f => ({ ...f, animalType: e.target.value }))}
                  className="mt-1 w-full bg-[#0f1a0f] border border-green-900/50 rounded-xl px-4 py-2.5 text-white"
                >
                  {SPECIES_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="block text-sm text-gray-400">
                Breed
                <input
                  id="input-breed"
                  value={form.breed}
                  onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                  className="mt-1 w-full bg-[#0f1a0f] border border-green-900/50 rounded-xl px-4 py-2.5 text-white"
                  placeholder="e.g. Nguni, Hereford"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm text-gray-400">
                  Weight (kg)
                  <input
                    id="input-weight"
                    type="number"
                    value={form.weightKg}
                    onChange={e => setForm(f => ({ ...f, weightKg: +e.target.value }))}
                    className="mt-1 w-full bg-[#0f1a0f] border border-green-900/50 rounded-xl px-4 py-2.5 text-white"
                  />
                </label>
                <label className="block text-sm text-gray-400">
                  Age (months)
                  <input
                    id="input-age"
                    type="number"
                    value={form.ageMonths}
                    onChange={e => setForm(f => ({ ...f, ageMonths: +e.target.value }))}
                    className="mt-1 w-full bg-[#0f1a0f] border border-green-900/50 rounded-xl px-4 py-2.5 text-white"
                  />
                </label>
              </div>
              <label className="block text-sm text-gray-400">
                Health Status
                <select
                  id="select-health"
                  value={form.healthStatus}
                  onChange={e => setForm(f => ({ ...f, healthStatus: e.target.value }))}
                  className="mt-1 w-full bg-[#0f1a0f] border border-green-900/50 rounded-xl px-4 py-2.5 text-white"
                >
                  {HEALTH_OPTIONS.map(h => <option key={h}>{h}</option>)}
                </select>
              </label>
              <label className="block text-sm text-gray-400">
                RFID Tag
                <input
                  id="input-rfid"
                  value={form.rfidTag}
                  onChange={e => setForm(f => ({ ...f, rfidTag: e.target.value }))}
                  className="mt-1 w-full bg-[#0f1a0f] border border-green-900/50 rounded-xl px-4 py-2.5 text-white font-mono"
                  placeholder="e.g. ZA-001-2026"
                />
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                id="btn-submit-register"
                onClick={() => register(form)}
                disabled={isPending}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-semibold text-white transition-all"
              >
                {isPending ? 'Registering...' : 'Register Animal'}
              </button>
              <button
                id="btn-cancel-register"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-green-900/50 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
