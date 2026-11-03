import { motion } from "framer-motion";
import { ShieldCheck, Database, LockKeyhole, Layers3 } from "lucide-react";

import TokenInputPanel from "../components/TokenInputPanel";
import VaultStatus from "../components/VaultStatus";

function Dashboard() {
  return (
    <main className="page-container px-10 py-10 space-y-14">
      {/* HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6">
          <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5">
            <ShieldCheck size={54} className="text-cyan-400" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-cyan-400">
              FragVault API Token Storage
            </h1>

            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
              PostgreSQL-backed API token fragmentation system using XOR-based
              secret splitting to reduce vault compromise risk.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECURITY SUMMARY CARDS */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-7 shadow-lg">
          <div className="flex items-start gap-5">
            <div className="rounded-2xl bg-cyan-500/10 p-4">
              <Layers3 size={30} className="text-cyan-400" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                XOR Fragmentation
              </h3>

              <p className="text-sm leading-relaxed text-slate-400">
                API tokens are split into three XOR-based fragments before
                storage. No single fragment contains the full secret.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-purple-500/30 bg-slate-900/80 p-7 shadow-lg">
          <div className="flex items-start gap-5">
            <div className="rounded-2xl bg-purple-500/10 p-4">
              <Database size={30} className="text-purple-400" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                PostgreSQL Vaults
              </h3>

              <p className="text-sm leading-relaxed text-slate-400">
                Fragments are stored in separated PostgreSQL vault tables:
                Vault A, Vault B, and Vault C.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-7 shadow-lg">
          <div className="flex items-start gap-5">
            <div className="rounded-2xl bg-emerald-500/10 p-4">
              <LockKeyhole size={30} className="text-emerald-400" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                Compromise Reduction
              </h3>

              <p className="text-sm leading-relaxed text-slate-400">
                If one vault is exposed or one fragment is intercepted, the
                original API token still cannot be reconstructed.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* TOKEN MANAGEMENT */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="space-y-4">
          <h2 className="text-5xl font-black tracking-tight text-cyan-400">
            Token Fragmentation Console
          </h2>

          <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
            Upload enterprise credential files or load simulated API secrets to
            perform secure distributed XOR fragmentation across
            PostgreSQL-backed fragment vaults.
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-500/40 bg-slate-900/80 p-10 shadow-xl">
          <TokenInputPanel />
        </div>
      </motion.section>

      {/* VAULT STATUS MOVED INTO DASHBOARD */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="space-y-4">
          <h2 className="text-5xl font-black tracking-tight text-cyan-400">
            PostgreSQL Fragment Vault Status
          </h2>

          <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
            Live view of the PostgreSQL-backed fragment vault layer. Each vault
            stores only one fragment type, reducing the impact of a single vault
            compromise.
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-500/40 bg-slate-900/80 p-10 shadow-xl">
          <VaultStatus />
        </div>
      </motion.section>
    </main>
  );
}

export default Dashboard;