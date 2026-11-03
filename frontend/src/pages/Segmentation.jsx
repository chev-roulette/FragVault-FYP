import { useState } from "react";
import { motion } from "framer-motion";
import {
  Binary,
  Database,
  KeyRound,
  Layers3,
  LockKeyhole,
  Play,
  ShieldCheck,
  Split,
  Workflow,
} from "lucide-react";

import { visualizeXOR } from "../services/api";

function ConceptCard({ icon, title, description, accent }) {
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

function StepShell({ step, title, description, icon, accent, children }) {
  const styles = {
    cyan: {
      border: "border-cyan-500/40",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
    },
    purple: {
      border: "border-purple-500/40",
      bg: "bg-purple-500/10",
      text: "text-purple-400",
    },
    emerald: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
    pink: {
      border: "border-pink-500/40",
      bg: "bg-pink-500/10",
      text: "text-pink-400",
    },
  };

  const style = styles[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border ${style.border} bg-slate-950/60 p-8`}
    >
      <div className="mb-7 flex items-start gap-6">
        <div className={`rounded-2xl ${style.bg} p-4`}>
          {icon}
        </div>

        <div className="space-y-3">
          <div className={`text-sm font-black tracking-widest ${style.text}`}>
            STEP {step}
          </div>

          <h3 className="text-3xl font-bold text-white">
            {title}
          </h3>

          <p className="max-w-5xl text-sm leading-relaxed text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </motion.div>
  );
}

function FragmentBox({ label, value, vault, accent }) {
  const styles = {
    cyan: {
      border: "border-cyan-500/40",
      bg: "bg-cyan-500/10",
      text: "text-cyan-300",
    },
    purple: {
      border: "border-purple-500/40",
      bg: "bg-purple-500/10",
      text: "text-purple-300",
    },
    emerald: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      text: "text-emerald-300",
    },
  };

  const style = styles[accent];

  return (
    <div className={`rounded-3xl border ${style.border} bg-slate-900/80 p-6`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl ${style.bg} p-3`}>
            <Layers3 size={22} className={style.text} />
          </div>

          <h4 className={`text-lg font-bold ${style.text}`}>
            {label}
          </h4>
        </div>

        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-400">
          {vault}
        </span>
      </div>

      <div className="min-h-28 rounded-2xl border border-slate-700 bg-slate-950 p-4">
        <p className="break-all font-mono text-xs leading-relaxed text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function Segmentation() {
  const [userSecret, setUserSecret] = useState("");
  const [visualizedSecret, setVisualizedSecret] = useState("");
  const [generatedFragments, setGeneratedFragments] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVisualization = async () => {
    if (!userSecret.trim()) {
      setMessage("Please enter a sample API token first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      setVisualizedSecret(userSecret);

      const data = await visualizeXOR(userSecret);

      setGeneratedFragments(data.fragments);
      setMessage("XOR fragments generated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to generate XOR visualization.");
    } finally {
      setLoading(false);
    }
  };

  const fragmentA =
    generatedFragments?.vaultA || "Fragment A will appear here after generation.";

  const fragmentB =
    generatedFragments?.vaultB || "Fragment B will appear here after generation.";

  const fragmentC =
    generatedFragments?.vaultC || "Fragment C will appear here after calculation.";

  return (
    <main className="page-container px-10 py-10 space-y-12">
      {/* PAGE HEADER */}
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-6">
          <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5 shadow-lg shadow-cyan-500/10">
            <Binary size={54} className="text-cyan-400" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-cyan-400">
              XOR Segmentation Lab
            </h1>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              A focused step-by-step lab showing how FragVault converts one API
              token into distributed XOR fragments for PostgreSQL-backed vault
              storage.
            </p>
          </div>
        </div>
      </motion.section>

      {/* CONCEPT SUMMARY */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-8 xl:grid-cols-3"
      >
        <ConceptCard
          accent="cyan"
          icon={<LockKeyhole size={32} className="text-cyan-400" />}
          title="No Complete Token Stored"
          description="FragVault does not store the full API token in one location. The original token only exists after all required fragments are recombined."
        />

        <ConceptCard
          accent="purple"
          icon={<Database size={32} className="text-purple-400" />}
          title="PostgreSQL Vault Layer"
          description="Each fragment is stored in a separated PostgreSQL vault table, allowing the system to demonstrate distributed vault storage instead of local fragment files."
        />

        <ConceptCard
          accent="emerald"
          icon={<ShieldCheck size={32} className="text-emerald-400" />}
          title="One Fragment Is Useless"
          description="If one vault is compromised or one fragment is intercepted, the attacker still cannot reconstruct the original API token."
        />
      </motion.section>

      {/* MAIN LAB */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-cyan-500/40 bg-slate-900/80 p-10 shadow-xl"
      >
        <div className="mb-10 flex items-start gap-5">
          <div className="rounded-2xl bg-cyan-500/10 p-4">
            <Workflow size={36} className="text-cyan-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              Interactive XOR Fragmentation Workflow
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              The visualizer is embedded directly into the workflow. Each step
              shows one part of the fragmentation process instead of separating
              the explanation from the lab.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* STEP 01 */}
          <StepShell
            step="01"
            accent="cyan"
            icon={<KeyRound size={34} className="text-cyan-400" />}
            title="Enter API Token"
            description="Input a sample API token. This token is only used for lab visualization and will be split into XOR fragments."
          >
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_auto]">
              <input
                type="text"
                placeholder="Example: api_live_9xLmQa72"
                value={userSecret}
                onChange={(event) => setUserSecret(event.target.value)}
                className="w-full rounded-2xl border border-cyan-500/40 bg-slate-900 px-6 py-5 font-mono text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />

              <button
                onClick={handleVisualization}
                disabled={loading}
                className="rounded-2xl bg-cyan-500 px-8 py-5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                <Play size={20} className="mr-2 inline-block" />
                {loading ? "Generating..." : "Generate Fragments"}
              </button>
            </div>

            {message && (
              <p className="mt-5 text-sm leading-relaxed text-slate-400">
                {message}
              </p>
            )}

            <div className="mt-6 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6">
              <h4 className="text-lg font-bold text-cyan-300">
                Original API Token
              </h4>

              <p className="mt-3 break-all rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-relaxed text-slate-300">
                {visualizedSecret || "No token generated yet."}
              </p>
            </div>
          </StepShell>

          {/* STEP 02 */}
          <StepShell
            step="02"
            accent="purple"
            icon={<Split size={34} className="text-purple-400" />}
            title="Generate Random XOR Fragments"
            description="FragVault generates random fragment values. These fragments look like random hexadecimal data and do not reveal the original token."
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <FragmentBox
                label="Fragment A"
                vault="Vault A"
                value={fragmentA}
                accent="cyan"
              />

              <FragmentBox
                label="Fragment B"
                vault="Vault B"
                value={fragmentB}
                accent="purple"
              />
            </div>
          </StepShell>

          {/* STEP 03 */}
          <StepShell
            step="03"
            accent="emerald"
            icon={<Binary size={34} className="text-emerald-400" />}
            title="Calculate XOR Recovery Fragment"
            description="The third fragment is calculated so the three fragments are mathematically linked. The original token can only be reconstructed when all fragments are combined."
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
              <FragmentBox
                label="Fragment C"
                vault="Vault C"
                value={fragmentC}
                accent="emerald"
              />

              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
                <h4 className="text-lg font-bold text-emerald-300">
                  Reconstruction Relationship
                </h4>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  FragVault follows this XOR relationship:
                </p>

                <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-slate-950 px-6 py-5 font-mono text-base font-bold text-emerald-300">
                  API Token = Fragment A XOR Fragment B XOR Fragment C
                </div>
              </div>
            </div>
          </StepShell>

          {/* STEP 04 */}
          <StepShell
            step="04"
            accent="pink"
            icon={<Database size={34} className="text-pink-400" />}
            title="Distribute Fragments to PostgreSQL Vaults"
            description="Each generated fragment is assigned to a separate PostgreSQL-backed vault table. This prevents one vault from storing the complete API token."
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-cyan-500/40 bg-cyan-500/10 p-6">
                <h4 className="text-lg font-bold text-cyan-300">
                  PostgreSQL Vault A
                </h4>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Stores Fragment A only.
                </p>
              </div>

              <div className="rounded-3xl border border-purple-500/40 bg-purple-500/10 p-6">
                <h4 className="text-lg font-bold text-purple-300">
                  PostgreSQL Vault B
                </h4>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Stores Fragment B only.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
                <h4 className="text-lg font-bold text-emerald-300">
                  PostgreSQL Vault C
                </h4>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Stores Fragment C only.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-7">
              <h4 className="text-xl font-bold text-emerald-300">
                Security Outcome
              </h4>

              <p className="mt-3 max-w-5xl text-sm leading-relaxed text-slate-300">
                The workflow produces a distributed fragment set, not one stored
                secret. This means one intercepted fragment or one compromised
                vault cannot reveal the original API token.
              </p>
            </div>
          </StepShell>
        </div>
      </motion.section>
    </main>
  );
}

export default Segmentation;