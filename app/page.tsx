import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0f1a0f] text-white font-['Inter']">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a3a1a_0%,_#0f1a0f_70%)]" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-4 py-1 mb-6 text-xs font-semibold tracking-widest text-amber-400 border border-amber-400/30 rounded-full bg-amber-400/10 uppercase">
            🐄 Livestock-Backed DeFi on Stellar
          </span>
          <h1 className="font-['Outfit'] text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">
            Unlock capital from<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-green-400">
              your kraal
            </span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            StellarKraal enables rural farmers to tokenize cattle and access instant USDC loans via Soroban smart contracts. Investors earn yield by funding real-world agriculture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              id="cta-farmer"
              href="/farmer"
              className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-green-900/50"
            >
              I&apos;m a Farmer 🌾
            </Link>
            <Link
              id="cta-investor"
              href="/investor"
              className="px-8 py-4 border border-amber-400/40 hover:bg-amber-400/10 rounded-xl font-semibold text-amber-400 transition-all duration-200 hover:scale-105"
            >
              I&apos;m an Investor 💰
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-green-900/50 bg-[#111a11] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { label: 'Total Value Locked', value: '$124,500 USDC' },
            { label: 'Active Loans',       value: '37' },
            { label: 'Farmers Registered', value: '128' },
          ].map((stat) => (
            <div key={stat.label} className="group">
              <p className="text-3xl font-bold font-['Outfit'] text-green-400 group-hover:text-amber-400 transition-colors">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
