import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  getSecretInventory,
  reconstructSecret,
} from "../services/api";

function SummaryCard({ icon, title, description, accent }) {
  const styles = {
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
  };

  const style = styles[accent];

  return (
    <div className={`rounded-3xl border ${style.border} bg-slate-900/80 p-8 shadow-xl`}>
      <div className={`mb-6 w-fit rounded-2xl ${style.bg} p-4`}>
        {icon}
      </div>

      <h2 className="text-2xl font-bold text-white">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-800 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] break-all text-right text-sm font-semibold text-slate-200">
        {value || "Unavailable"}
      </span>
    </div>
  );
}

function Reconstruction() {
  const [inventory, setInventory] = useState([]);
  const [selectedSecret, setSelectedSecret] = useState("");
  const [reconstructedSecret, setReconstructedSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchInventory = async () => {
    try {
      setMessage("");

      const data = await getSecretInventory();
      setInventory(data);

      if (data.length > 0 && !selectedSecret) {
        setSelectedSecret(data[0].id);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load stored API token inventory.");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReconstruct = async () => {
    if (!selectedSecret) {
      setMessage("Please select a stored API token first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setReconstructedSecret("");

      const data = await reconstructSecret(selectedSecret);

      setReconstructedSecret(data.reconstructed_secret);
      setMessage("API token reconstructed successfully.");
    } catch (error) {
      console.error(error);
      setReconstructedSecret("");
      setMessage(
        error.message ||
          "Reconstruction failed. Required fragments may be missing or unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedRecord = inventory.find((item) => item.id === selectedSecret);

  return (
    <main className="page-container px-10 py-10 space-y-12">
      {/* PAGE HEADER */}
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-6">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/10">
            <KeyRound size={54} className="text-emerald-400" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-emerald-400">
              API Token Reconstruction
            </h1>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Select a stored API token record and reconstruct it from its
              PostgreSQL-backed XOR fragments.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <SummaryCard
          accent="cyan"
          icon={<Database size={32} className="text-cyan-400" />}
          title="Fragment Retrieval"
          description="FragVault retrieves the required fragments from Vault A, Vault B, and Vault C."
        />

        <SummaryCard
          accent="purple"
          icon={<ShieldCheck size={32} className="text-purple-400" />}
          title="XOR Dependency"
          description="The token can only be reconstructed when all required XOR fragments are available."
        />

        <SummaryCard
          accent="emerald"
          icon={<LockKeyhole size={32} className="text-emerald-400" />}
          title="Controlled Recovery"
          description="A single vault record or intercepted fragment is not enough to reveal the original API token."
        />
      </section>

      {/* SIMPLE RECONSTRUCTION PANEL */}
      <section className="rounded-3xl border border-emerald-500/40 bg-slate-900/80 p-10 shadow-xl">
        <div className="mb-10 flex items-start gap-5">
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <Search size={36} className="text-emerald-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              Select and Reconstruct
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Choose one stored token record from the vault index, then trigger
              reconstruction.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_0.8fr]">
          {/* LEFT SIDE */}
          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-8">
            <label className="mb-3 block text-sm font-semibold text-slate-400">
              Stored Token Record
            </label>

            <select
              value={selectedSecret}
              onChange={(event) => {
                setSelectedSecret(event.target.value);
                setReconstructedSecret("");
                setMessage("");
              }}
              className="w-full rounded-2xl border border-emerald-500/40 bg-slate-900 px-5 py-5 text-white outline-none transition focus:border-emerald-300"
            >
              {inventory.length === 0 ? (
                <option value="">No stored records available</option>
              ) : (
                inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.service} | {item.environment} | {item.id}
                  </option>
                ))
              )}
            </select>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleReconstruct}
                disabled={loading || !selectedSecret}
                className="rounded-2xl bg-emerald-500 px-8 py-5 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <KeyRound size={20} className="mr-2 inline-block" />
                {loading ? "Reconstructing..." : "Reconstruct Token"}
              </button>

              <button
                onClick={fetchInventory}
                className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-5 font-bold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                <RefreshCw size={20} className="mr-2 inline-block" />
                Refresh
              </button>
            </div>

            {message && (
              <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 text-sm leading-relaxed text-slate-300">
                {message}
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-8">
            <h3 className="text-2xl font-bold text-emerald-300">
              Selected Record
            </h3>

            {selectedRecord ? (
              <div className="mt-6">
                <DetailRow label="Secret ID" value={selectedRecord.id} />
                <DetailRow label="Service" value={selectedRecord.service} />
                <DetailRow label="Environment" value={selectedRecord.environment} />
                <DetailRow label="Owner" value={selectedRecord.owner} />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                No token record selected.
              </p>
            )}
          </div>
        </div>

        {/* OUTPUT */}
        <div className="mt-10 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8">
          <div className="mb-5 flex items-center gap-3">
            <KeyRound size={28} className="text-emerald-400" />

            <h3 className="text-2xl font-bold text-emerald-300">
              Reconstructed API Token
            </h3>
          </div>

          {reconstructedSecret ? (
            <p className="break-all rounded-2xl border border-emerald-500/30 bg-slate-950 p-6 font-mono text-base font-bold leading-relaxed text-emerald-300">
              {reconstructedSecret}
            </p>
          ) : (
            <p className="rounded-2xl border border-slate-700 bg-slate-950 p-6 text-sm leading-relaxed text-slate-500">
              The reconstructed API token will appear here after successful
              reconstruction.
            </p>
          )}
        </div>
      </section>

      {/* SECURITY NOTE */}
      <section className="rounded-3xl border border-emerald-500/40 bg-emerald-950/40 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-emerald-300">
          Reconstruction Security Note
        </h2>

        <p className="mt-3 max-w-5xl text-sm leading-relaxed text-slate-300">
          FragVault does not reconstruct a token from one vault alone. The
          reconstruction process depends on the vault index and all three
          PostgreSQL-backed XOR fragments.
        </p>
      </section>
    </main>
  );
}

export default Reconstruction;