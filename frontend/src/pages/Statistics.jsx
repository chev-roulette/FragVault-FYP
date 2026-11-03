import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Database,
  Layers3,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  LockKeyhole,
  Activity,
} from "lucide-react";

import { getStatistics } from "../services/api";

function StatBox({ title, value, description, icon, accent = "cyan" }) {
  const accentClasses = {
    cyan: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
    },
    purple: {
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      text: "text-purple-400",
    },
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
    red: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-400",
    },
  };

  const style = accentClasses[accent];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-3xl border ${style.border} bg-slate-900/80 p-8 shadow-xl`}
    >
      <div className="mb-6 flex items-start justify-between gap-5">
        <div className={`rounded-2xl ${style.bg} p-4`}>
          {icon}
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-400">
        {title}
      </p>

      <p className={`mt-3 text-4xl font-black ${style.text}`}>
        {value}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </motion.div>
  );
}

function VaultDistributionBar({ label, value, percent, accent }) {
  const colorClasses = {
    cyan: "bg-cyan-400",
    purple: "bg-purple-400",
    emerald: "bg-emerald-400",
  };

  const textClasses = {
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-6">
        <span className="font-semibold text-white">
          {label}
        </span>

        <span className={`font-bold ${textClasses[accent]}`}>
          {value} fragments · {percent}%
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-slate-950">
        <div
          className={`h-full rounded-full ${colorClasses[accent]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Statistics() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load FragVault statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    const interval = setInterval(() => {
      fetchStatistics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !statistics) {
    return (
      <main className="page-container px-10 py-10">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 text-lg text-slate-300">
          Loading FragVault statistics...
        </div>
      </main>
    );
  }

  if (!statistics) {
    return (
      <main className="page-container px-10 py-10">
        <div className="rounded-3xl border border-red-500/50 bg-red-950/60 p-8 text-red-300">
          {message || "Statistics are unavailable."}
        </div>
      </main>
    );
  }

  const totalFragments = statistics.totalFragments || 0;

  const vaultA = statistics.vaultA || 0;
  const vaultB = statistics.vaultB || 0;
  const vaultC = statistics.vaultC || 0;

  const vaultAPercent = statistics.vaultA_percent || 0;
  const vaultBPercent = statistics.vaultB_percent || 0;
  const vaultCPercent = statistics.vaultC_percent || 0;

  const reconstructionSuccess = statistics.reconstructionSuccess || 0;
  const fragmentIsolation = statistics.fragmentIsolation || 0;
  const breachContainment = statistics.breachContainment || 0;

  return (
    <main className="page-container px-10 py-10 space-y-12">
      {/* PAGE HEADER */}
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5 shadow-lg shadow-cyan-500/10">
              <BarChart3 size={54} className="text-cyan-400" />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-cyan-400">
                FragVault Statistics
              </h1>

              <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
                Live metrics showing PostgreSQL-backed fragment distribution,
                reconstruction readiness, and vault compromise reduction.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {message && (
        <div className="rounded-3xl border border-red-500/50 bg-red-950/60 p-6 text-red-300">
          {message}
        </div>
      )}

      {/* MAIN METRICS */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-4">
        <StatBox
          title="Total Stored Fragments"
          value={totalFragments}
          description="Total XOR fragments currently stored across the PostgreSQL vault tables."
          icon={<Layers3 size={34} className="text-cyan-400" />}
          accent="cyan"
        />

        <StatBox
          title="Storage Backend"
          value={statistics.storageBackend || "PostgreSQL"}
          description="Current storage layer used by FragVault for fragment vault persistence."
          icon={<Database size={34} className="text-purple-400" />}
          accent="purple"
        />

        <StatBox
          title="Reconstruction Readiness"
          value={`${reconstructionSuccess}%`}
          description="Indicates whether the vault tables contain balanced fragments for reconstruction."
          icon={<LockKeyhole size={34} className="text-emerald-400" />}
          accent="emerald"
        />

        <StatBox
          title="Breach Containment"
          value={`${breachContainment}%`}
          description="Demonstration metric representing the containment benefit of distributed fragment storage."
          icon={<ShieldCheck size={34} className="text-emerald-400" />}
          accent="emerald"
        />
      </section>

      {/* VAULT DISTRIBUTION */}
      <section className="rounded-3xl border border-cyan-500/40 bg-slate-900/80 p-10 shadow-xl">
        <div className="mb-10 flex items-start gap-5">
          <div className="rounded-2xl bg-cyan-500/10 p-4">
            <Database size={36} className="text-cyan-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              PostgreSQL Vault Distribution
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Each API token is split into three XOR fragments. The chart below
              shows how many fragments are stored in Vault A, Vault B, and Vault
              C.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <VaultDistributionBar
            label="PostgreSQL Vault A"
            value={vaultA}
            percent={vaultAPercent}
            accent="cyan"
          />

          <VaultDistributionBar
            label="PostgreSQL Vault B"
            value={vaultB}
            percent={vaultBPercent}
            accent="purple"
          />

          <VaultDistributionBar
            label="PostgreSQL Vault C"
            value={vaultC}
            percent={vaultCPercent}
            accent="emerald"
          />
        </div>

        <div className="mt-10 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-7">
          <h3 className="text-xl font-bold text-cyan-300">
            What this means
          </h3>

          <p className="mt-3 max-w-5xl text-sm leading-relaxed text-slate-300">
            A balanced distribution means each stored API token has one fragment
            in each PostgreSQL vault table. Reconstruction is only possible when
            all three corresponding fragments are available.
          </p>
        </div>
      </section>

      {/* SECURITY EFFECTIVENESS */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/80 p-10 shadow-xl">
          <div className="mb-8 flex items-start gap-5">
            <div className="rounded-2xl bg-emerald-500/10 p-4">
              <ShieldCheck size={36} className="text-emerald-400" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-black tracking-tight text-white">
                Fragment Isolation
              </h2>

              <p className="max-w-3xl text-lg leading-relaxed text-slate-400">
                Demonstrates that one vault table does not contain the complete
                API token.
              </p>
            </div>
          </div>

          <p className="text-6xl font-black text-emerald-400">
            {fragmentIsolation}%
          </p>

          <p className="mt-6 text-sm leading-relaxed text-slate-400">
            This metric represents the security benefit of separating the API
            token into independent XOR fragments before storage.
          </p>
        </div>

        <div className="rounded-3xl border border-purple-500/40 bg-slate-900/80 p-10 shadow-xl">
          <div className="mb-8 flex items-start gap-5">
            <div className="rounded-2xl bg-purple-500/10 p-4">
              <Activity size={36} className="text-purple-400" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-black tracking-tight text-white">
                Reconstruction Dependency
              </h2>

              <p className="max-w-3xl text-lg leading-relaxed text-slate-400">
                Shows that reconstruction depends on all required vault
                fragments being present.
              </p>
            </div>
          </div>

          <p className="text-6xl font-black text-purple-400">
            {reconstructionSuccess}%
          </p>

          <p className="mt-6 text-sm leading-relaxed text-slate-400">
            If Vault A, Vault B, and Vault C contain matching fragment counts,
            the system is ready to reconstruct stored tokens after integrity
            verification.
          </p>
        </div>
      </section>

      {/* RISK EXPLANATION */}
      <section className="rounded-3xl border border-emerald-500/40 bg-emerald-950/40 p-10 shadow-xl">
        <div className="mb-8 flex items-start gap-5">
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-emerald-400">
              Vault Compromise Reduction
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-300">
              FragVault reduces vault compromise risk by ensuring that no
              PostgreSQL vault table stores a complete API token.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-7">
            <h3 className="text-xl font-bold text-cyan-300">
              One Vault Exposed
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              The attacker only obtains one XOR fragment and cannot reconstruct
              the token.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-7">
            <h3 className="text-xl font-bold text-purple-300">
              Fragment Intercepted
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              One intercepted fragment remains unusable without the remaining
              fragments and correlation information.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-7">
            <h3 className="text-xl font-bold text-emerald-300">
              Full Set Required
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Full reconstruction requires Vault A, Vault B, Vault C, and the
              correct vault index mapping.
            </p>
          </div>
        </div>
      </section>

      {/* WARNING / LIMITATION */}
      <section className="rounded-3xl border border-orange-500/40 bg-orange-950/30 p-8 shadow-xl">
        <div className="flex items-start gap-5">
          <div className="rounded-2xl bg-orange-500/10 p-4">
            <AlertTriangle size={34} className="text-orange-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-orange-300">
              Prototype Metric Note
            </h2>

            <p className="max-w-5xl text-sm leading-relaxed text-slate-300">
              Some security-effectiveness values, such as fragment isolation and
              breach containment, are demonstration metrics used to communicate
              the prototype’s security concept. The live counts are taken from
              PostgreSQL vault table records.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Statistics;