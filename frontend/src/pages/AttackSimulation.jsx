import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Eye,
  KeyRound,
  Layers3,
  Play,
  RefreshCw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Target,
  Unlock,
} from "lucide-react";

import {
  getAttackDemoStatus,
  resetAttackDemo,
  compromiseVault,
  interceptFragment,
  fullFragmentCompromise,
} from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const attackScenarios = [
  {
    id: "COMPROMISE_VAULT_A",
    title: "Vault A Compromise",
    description:
      "Simulates a compromise of Vault A. Fragment A becomes exposed, while Vault B and Vault C remain protected.",
    expectedResult:
      "Vault A is compromised, but attacker reconstruction remains blocked because only one fragment is exposed.",
    outcomeType: "blocked",
  },
  {
    id: "INTERCEPT_FRAGMENT_A",
    title: "One Fragment Interception",
    description:
      "Simulates an attacker intercepting Fragment A from the compromised vault.",
    expectedResult:
      "One fragment is intercepted, but it cannot reconstruct the original API token by itself.",
    outcomeType: "blocked",
  },
  {
    id: "INTERCEPT_TWO_FRAGMENTS",
    title: "Two Fragments Intercepted",
    description:
      "Simulates the attacker obtaining Fragment A and Fragment B.",
    expectedResult:
      "Two fragments are exposed, but reconstruction remains blocked because Fragment C is still missing.",
    outcomeType: "blocked",
  },
  {
    id: "FULL_FRAGMENT_COMPROMISE",
    title: "Full Fragment Compromise",
    description:
      "Simulates the attacker obtaining Fragment A, Fragment B, and Fragment C.",
    expectedResult:
      "All three fragments are exposed. This is the security boundary where reconstruction becomes possible.",
    outcomeType: "danger",
  },
];

const demoFlow = [
  {
    number: "01",
    title: "Normal FragVault Storage",
    description:
      "Store a sample API token and show that it is split into Fragment A, Fragment B, and Fragment C.",
  },
  {
    number: "02",
    title: "Attack Surface Discovery",
    description:
      "Simulate the attacker identifying the frontend, backend API, and PostgreSQL vault layer.",
  },
  {
    number: "03",
    title: "Vault Compromise",
    description:
      "Simulate Vault A compromise and show that only Fragment A is exposed.",
  },
  {
    number: "04",
    title: "Fragment Interception",
    description:
      "Simulate one or two intercepted fragments and show that reconstruction is still blocked.",
  },
  {
    number: "05",
    title: "Full Compromise Boundary",
    description:
      "Expose all three fragments to show when attacker reconstruction becomes possible.",
  },
  {
    number: "06",
    title: "Reset Demo",
    description:
      "Reset all vaults and fragments to protected state for repeating the viva demo.",
  },
];

function StatusPill({ value }) {
  const normalized = String(value || "").toLowerCase();

  const isDanger =
    normalized.includes("compromised") ||
    normalized.includes("exposed") ||
    normalized.includes("intercepted") ||
    normalized.includes("possible") ||
    normalized.includes("failed");

  const isSafe =
    normalized.includes("protected") ||
    normalized.includes("blocked") ||
    normalized.includes("secure") ||
    normalized.includes("maintained");

  return (
    <span
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide ${
        isDanger
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : isSafe
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
      }`}
    >
      {value}
    </span>
  );
}

function DemoFlowCard({ number, title, description }) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-lg font-black text-cyan-400">
        {number}
      </div>

      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DataMetricCard({ title, value, description, accent }) {
  const styles = {
    cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    purple: "border-purple-500/40 bg-purple-500/10 text-purple-300",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    red: "border-red-500/40 bg-red-500/10 text-red-300",
  };

  return (
    <div className={`rounded-3xl border ${styles[accent]} p-7 shadow-xl`}>
      <p className="text-sm font-semibold text-slate-400">
        {title}
      </p>

      <p className="mt-4 text-4xl font-black">
        {value}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

function AttackSurfaceCard({ title, port, description, icon, accent }) {
  const styles = {
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <div className={`rounded-3xl border ${styles[accent]} p-7`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="rounded-2xl bg-slate-950/60 p-4">
          {icon}
        </div>

        <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-black text-slate-300">
          Port {port}
        </span>
      </div>

      <h3 className="text-2xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        {description}
      </p>
    </div>
  );
}

function VaultStatusCard({ title, fragmentLabel, vault }) {
  const vaultStatus = vault?.vault_status || vault?.status || "protected";
  const fragmentStatus = vault?.fragment_status || "protected";

  const affected =
    vaultStatus === "compromised" ||
    fragmentStatus === "exposed" ||
    fragmentStatus === "intercepted";

  return (
    <div
      className={`rounded-3xl border p-8 shadow-xl ${
        affected
          ? "border-red-500/40 bg-red-950/40"
          : "border-emerald-500/30 bg-slate-900/80"
      }`}
    >
      <div className="mb-7 flex items-center justify-between gap-4">
        <div
          className={`rounded-2xl p-4 ${
            affected ? "bg-red-500/10" : "bg-emerald-500/10"
          }`}
        >
          {affected ? (
            <Unlock size={32} className="text-red-400" />
          ) : (
            <ShieldCheck size={32} className="text-emerald-400" />
          )}
        </div>

        <StatusPill value={vaultStatus} />
      </div>

      <h3 className="text-2xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Stores {fragmentLabel} only.
      </p>

      <div className="mt-7 space-y-4">
        <div className="flex items-center justify-between gap-5">
          <span className="text-sm text-slate-500">
            Vault status
          </span>

          <StatusPill value={vaultStatus} />
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="text-sm text-slate-500">
            Fragment status
          </span>

          <StatusPill value={fragmentStatus} />
        </div>
      </div>

      <p className="mt-7 text-sm leading-relaxed text-slate-400">
        {affected
          ? `${fragmentLabel} is exposed to the attacker, but it is still only one part of the XOR secret.`
          : `${fragmentLabel} is protected and unavailable to the attacker.`}
      </p>
    </div>
  );
}

function EventTimeline({ events }) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  const previewLimit = 5;
  const visibleEvents = showAllEvents
    ? events
    : events.slice(0, previewLimit);

  const formatTimestamp = (value) => {
    if (!value) return "Time unavailable";

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString("en-MY", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  const formatAction = (value) =>
    String(value || "Attack attempt")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 shadow-xl"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div>
          <p className="text-sm font-bold text-white">
            Recorded attack attempts
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {events.length} persistent {events.length === 1 ? "event" : "events"} stored
          </p>
        </div>

        {events.length > previewLimit && (
          <button
            type="button"
            onClick={() => setShowAllEvents((current) => !current)}
            aria-expanded={showAllEvents}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {showAllEvents
              ? "Show Recent Attempts"
              : `View All ${events.length} Attempts`}
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex items-center gap-4 p-8 text-slate-400">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <span>No attack simulation events have been recorded yet.</span>
        </div>
      ) : (
        <div className="max-h-170 divide-y divide-slate-800 overflow-y-auto">
          {visibleEvents.map((event, index) => (
            <article key={event.id || index} className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
                  Attempt #{event.id || index + 1}
                </span>

                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
                  {event.severity || "INFO"}
                </span>

                <time
                  dateTime={event.timestamp || event.created_at}
                  className="text-sm text-slate-500"
                >
                  {formatTimestamp(event.timestamp || event.created_at)}
                </time>
              </div>

              <h3 className="text-lg font-bold text-white">
                {formatAction(event.action)}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {event.outcome}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {event.event_metadata?.demo_client && (
                  <span className="rounded-lg bg-amber-500/10 px-3 py-2 font-semibold text-amber-300">
                    Source: {event.event_metadata.demo_client}
                  </span>
                )}

                {event.event_metadata?.source_ip && (
                  <span className="rounded-lg bg-slate-800 px-3 py-2 font-semibold text-slate-300">
                    IP: {event.event_metadata.source_ip}
                  </span>
                )}

                {event.event_metadata?.database_user && (
                  <span className="rounded-lg bg-fuchsia-500/10 px-3 py-2 font-semibold text-fuchsia-300">
                    DB user: {event.event_metadata.database_user}
                  </span>
                )}

                {event.event_metadata?.application_name && (
                  <span className="rounded-lg bg-indigo-500/10 px-3 py-2 font-semibold text-indigo-300">
                    Client: {event.event_metadata.application_name}
                  </span>
                )}

                {event.event_metadata?.http_method && event.event_metadata?.endpoint && (
                  <span className="rounded-lg bg-blue-500/10 px-3 py-2 font-semibold text-blue-300">
                    {event.event_metadata.http_method} {event.event_metadata.endpoint}
                  </span>
                )}

                {event.target && (
                  <span className="rounded-lg bg-cyan-500/10 px-3 py-2 font-semibold text-cyan-300">
                    Target: {event.event_metadata?.target_label || event.target}
                  </span>
                )}

                {typeof event.fragments_exposed === "number" && (
                  <span className="rounded-lg bg-purple-500/10 px-3 py-2 font-semibold text-purple-300">
                    Fragments exposed: {event.fragments_exposed} / 3
                  </span>
                )}

                {typeof event.reconstruction_possible === "boolean" && (
                  <span
                    className={`rounded-lg px-3 py-2 font-semibold ${
                      event.reconstruction_possible
                        ? "bg-red-500/10 text-red-300"
                        : "bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    Reconstruction: {event.reconstruction_possible ? "Possible" : "Blocked"}
                  </span>
                )}
              </div>

              {event.event_metadata?.statement && (
                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Detected SQL activity
                  </p>

                  <code className="mt-2 block overflow-x-auto whitespace-pre-wrap break-all text-xs leading-relaxed text-slate-300">
                    {event.event_metadata.statement}
                  </code>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AttackSimulation() {
  const [simulation, setSimulation] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("COMPROMISE_VAULT_A");
  const [scenarioMessage, setScenarioMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshingLiveData, setRefreshingLiveData] = useState(false);
  const [lastLiveRefresh, setLastLiveRefresh] = useState(null);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getAttackDemoStatus();

      setSimulation(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load attack simulation status.");
    }
  }, []);

  const handleRefreshLiveData = async () => {
    try {
      setRefreshingLiveData(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/attack-demo/refresh-live`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let message = "Unable to refresh live attack data.";

        try {
          const errorData = await response.json();
          message = errorData.detail || errorData.message || message;
        } catch {
          const responseText = await response.text();
          message = responseText || message;
        }

        throw new Error(message);
      }

      const data = await response.json();
      const detected = data.live_detection?.detected ?? 0;

      setSimulation(data);
      setLastLiveRefresh(new Date());

      setScenarioMessage(
        detected > 0
          ? `${detected} new live PostgreSQL attack event${
              detected === 1 ? "" : "s"
            } detected and added to the timeline.`
          : "No new PostgreSQL attack attempts were detected."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to refresh live attack data."
      );
    } finally {
      setRefreshingLiveData(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const selectedAttack = attackScenarios.find(
    (scenario) => scenario.id === selectedScenario
  );

  const runSelectedScenario = async () => {
    try {
      setLoading(true);
      setError("");
      setScenarioMessage("");

      let data = simulation;

      if (selectedScenario === "COMPROMISE_VAULT_A") {
        data = await compromiseVault("vaultA");
        setScenarioMessage(
          "Vault A compromised. Fragment A is exposed, but Vault B and Vault C remain protected."
        );
      }

      if (selectedScenario === "INTERCEPT_FRAGMENT_A") {
        data = await interceptFragment("vaultA");
        setScenarioMessage(
          "Fragment A intercepted. Attacker reconstruction remains blocked because Fragment B and Fragment C are missing."
        );
      }

      if (selectedScenario === "INTERCEPT_TWO_FRAGMENTS") {
        await interceptFragment("vaultA");
        data = await interceptFragment("vaultB");
        setScenarioMessage(
          "Fragment A and Fragment B intercepted. Reconstruction remains blocked because Fragment C is still protected."
        );
      }

      if (selectedScenario === "FULL_FRAGMENT_COMPROMISE") {
        data = await fullFragmentCompromise();
        setScenarioMessage(
          "All three fragments exposed. Attacker reconstruction is now possible."
        );
      }

      setSimulation(data);
    } catch (requestError) {
      setError(requestError.message || "Selected attack simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = async () => {
    try {
      setLoading(true);
      setError("");
      setScenarioMessage("");

      const data = await resetAttackDemo();

      setSimulation(data);
      setSelectedScenario("COMPROMISE_VAULT_A");
      setScenarioMessage(
        "Attack state reset. All vaults and fragments are protected."
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to reset attack simulation.");
    } finally {
      setLoading(false);
    }
  };

  if (!simulation) {
    return (
      <main className="page-container px-10 py-10">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 text-lg text-slate-300">
          Loading attack simulation state...
        </div>
      </main>
    );
  }

  const vaults = simulation.vaults || {};
  const metrics = simulation.metrics || {};
  const events = simulation.events || simulation.recent_events || [];

  const fragmentsObtained =
    metrics.exposed_fragments ??
    simulation.attacker_fragments_obtained ??
    0;

  const attackerCanReconstruct =
    metrics.attacker_reconstruction === "POSSIBLE" ||
    simulation.attacker_reconstruction === "possible";

  const latestAttack =
    scenarioMessage ||
    simulation.latest_attack ||
    "No attack has been simulated yet.";

  const vaultList = [
    {
      key: "vaultA",
      label: "Vault A",
      fragment: "Fragment A",
      data: vaults.vaultA,
    },
    {
      key: "vaultB",
      label: "Vault B",
      fragment: "Fragment B",
      data: vaults.vaultB,
    },
    {
      key: "vaultC",
      label: "Vault C",
      fragment: "Fragment C",
      data: vaults.vaultC,
    },
  ];

  const targetedVaults = vaultList.filter((vault) => {
    const vaultStatus = vault.data?.vault_status || vault.data?.status;
    const fragmentStatus = vault.data?.fragment_status;

    return (
      vaultStatus === "compromised" ||
      fragmentStatus === "exposed" ||
      fragmentStatus === "intercepted"
    );
  });

  const targetedVaultNames =
    targetedVaults.length > 0
      ? targetedVaults.map((vault) => vault.label).join(", ")
      : "None";

  const vaultAttackSurfacePercent =
    metrics.vault_attack_surface ??
    Math.round((targetedVaults.length / 3) * 100);

  const fragmentExposurePercent =
    Math.round((fragmentsObtained / 3) * 100);

  const reconstructionRiskPercent =
    attackerCanReconstruct ? 100 : 0;

  const containmentStatus =
    attackerCanReconstruct ? "Failed" : "Maintained";

  return (
    <main className="page-container px-10 py-10 space-y-12">
      {/* PAGE HEADER */}
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-6">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 shadow-lg shadow-red-500/10">
            <ShieldAlert size={54} className="text-red-400" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-red-400">
              Attack Simulation Lab
            </h1>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Select a simulated attack scenario and observe how FragVault
              responds to vault compromise and fragment interception.
            </p>
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="rounded-3xl border border-red-500/50 bg-red-950/60 p-6 text-red-300">
          {error}
        </div>
      )}

      {/* MAIN RESULT */}
      <section
        className={`rounded-3xl border p-10 shadow-xl ${
          attackerCanReconstruct
            ? "border-red-500/50 bg-red-950/60"
            : "border-emerald-500/50 bg-emerald-950/40"
        }`}
      >
        <div className="flex items-start gap-5">
          <div
            className={`rounded-2xl p-4 ${
              attackerCanReconstruct ? "bg-red-500/10" : "bg-emerald-500/10"
            }`}
          >
            {attackerCanReconstruct ? (
              <AlertTriangle size={44} className="text-red-400" />
            ) : (
              <ShieldCheck size={44} className="text-emerald-400" />
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
              Final attack outcome
            </p>

            <h2
              className={`text-5xl font-black tracking-tight ${
                attackerCanReconstruct ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {attackerCanReconstruct
                ? "Attacker Reconstruction Possible"
                : "Attacker Reconstruction Blocked"}
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-300">
              {attackerCanReconstruct
                ? "All three XOR fragments are exposed. This is the security boundary where the attacker can reconstruct the original API token."
                : "The attacker does not have all three XOR fragments. Partial vault compromise or fragment interception is contained."}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6">
            <p className="text-sm font-semibold text-slate-500">
              Fragments exposed
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-400">
              {fragmentsObtained} / 3
            </p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6">
            <p className="text-sm font-semibold text-slate-500">
              Containment status
            </p>

            <p
              className={`mt-3 text-4xl font-black ${
                attackerCanReconstruct ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {attackerCanReconstruct ? "FAILED" : "MAINTAINED"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6">
            <p className="text-sm font-semibold text-slate-500">
              Current scenario
            </p>

            <p className="mt-3 text-base font-semibold leading-relaxed text-slate-300">
              {latestAttack}
            </p>
          </div>
        </div>
      </section>

      {/* LIVE ATTACK DATA */}
      <section className="rounded-3xl border border-cyan-500/40 bg-slate-900/80 p-10 shadow-xl">
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-5">
            <div className="rounded-2xl bg-cyan-500/10 p-4">
              <BarChart3 size={36} className="text-cyan-400" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-black tracking-tight text-white">
                Live Attack Data
              </h2>

              <p className="max-w-4xl text-lg leading-relaxed text-slate-400">
                Check PostgreSQL security logs for real vault access, fragment
                reads, denied cross-vault queries, and full compromise attempts.
              </p>

              {lastLiveRefresh && (
                <p className="text-sm font-semibold text-cyan-300">
                  Last checked: {lastLiveRefresh.toLocaleString("en-MY")}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshLiveData}
            disabled={refreshingLiveData}
            className="shrink-0 rounded-2xl bg-cyan-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={20}
              className={`mr-2 inline-block ${
                refreshingLiveData ? "animate-spin" : ""
              }`}
            />

            {refreshingLiveData
              ? "Checking PostgreSQL Logs..."
              : "Refresh Live Attack Data"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <DataMetricCard
            accent={targetedVaults.length > 0 ? "red" : "emerald"}
            title="Vaults Targeted"
            value={`${targetedVaults.length} / 3`}
            description={`Affected vaults: ${targetedVaultNames}`}
          />

          <DataMetricCard
            accent={fragmentsObtained > 0 ? "red" : "emerald"}
            title="Fragments Exposed"
            value={`${fragmentsObtained} / 3`}
            description="Number of XOR fragments currently exposed to the attacker."
          />

          <DataMetricCard
            accent={vaultAttackSurfacePercent > 0 ? "purple" : "emerald"}
            title="Vault Attack Surface"
            value={`${vaultAttackSurfacePercent}%`}
            description="Percentage of PostgreSQL fragment vaults affected by the simulated attack."
          />

          <DataMetricCard
            accent={fragmentExposurePercent > 0 ? "red" : "emerald"}
            title="Fragment Exposure"
            value={`${fragmentExposurePercent}%`}
            description="Percentage of the full XOR fragment set exposed to the attacker."
          />

          <DataMetricCard
            accent={attackerCanReconstruct ? "red" : "emerald"}
            title="Containment Status"
            value={containmentStatus}
            description="Whether FragVault still prevents attacker reconstruction."
          />

          <DataMetricCard
            accent={attackerCanReconstruct ? "red" : "cyan"}
            title="Reconstruction Risk"
            value={`${reconstructionRiskPercent}%`}
            description="Risk becomes 100% only when all three fragments are exposed."
          />
        </div>
      </section>

      {/* ATTACK SCENARIO SELECTOR */}
      <section className="rounded-3xl border border-red-500/40 bg-slate-900/80 p-10 shadow-xl">
        <div className="mb-8 flex items-start gap-5">
          <div className="rounded-2xl bg-red-500/10 p-4">
            <Target size={36} className="text-red-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              Select Attack Scenario
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Select which attack occurs against the vaults or fragmented keys,
              then launch the simulation during your presentation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-400">
              Attack Option
            </label>

            <select
              value={selectedScenario}
              onChange={(event) => setSelectedScenario(event.target.value)}
              className="w-full rounded-2xl border border-red-500/40 bg-slate-950 px-5 py-5 text-white outline-none transition focus:border-red-300"
            >
              {attackScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={runSelectedScenario}
                disabled={loading}
                className="rounded-2xl bg-red-500 px-8 py-5 font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                <Play size={20} className="mr-2 inline-block" />
                {loading ? "Simulating..." : "Launch Selected Attack"}
              </button>

              <button
                onClick={resetScenario}
                disabled={loading}
                className="rounded-2xl bg-emerald-500 px-8 py-5 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <RefreshCw size={20} className="mr-2 inline-block" />
                Reset Attack State
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-7">
            <div className="mb-4 flex items-center gap-3">
              <Target size={24} className="text-red-300" />

              <h3 className="text-xl font-bold text-white">
                {selectedAttack?.title}
              </h3>
            </div>

            <p className="text-sm leading-relaxed text-slate-400">
              {selectedAttack?.description}
            </p>

            <div
              className={`mt-6 rounded-2xl border p-5 ${
                selectedAttack?.outcomeType === "danger"
                  ? "border-red-500/40 bg-red-500/10"
                  : selectedAttack?.outcomeType === "blocked"
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-cyan-500/40 bg-cyan-500/10"
              }`}
            >
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Expected Result
              </h4>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {selectedAttack?.expectedResult}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ATTACK SURFACE */}
      <section className="rounded-3xl border border-purple-500/40 bg-slate-900/80 p-10 shadow-xl">
        <div className="mb-8 flex items-start gap-5">
          <div className="rounded-2xl bg-purple-500/10 p-4">
            <Target size={36} className="text-purple-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              Attack Surface View
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              This section represents the surface identified in the demo:
              frontend, backend API, and PostgreSQL-backed vault storage.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <AttackSurfaceCard
            accent="cyan"
            title="Frontend Dashboard"
            port="5173"
            icon={<Eye size={30} className="text-cyan-300" />}
            description="Used to monitor vault exposure, fragment interception, and final attack outcome."
          />

          <AttackSurfaceCard
            accent="purple"
            title="Backend API"
            port="8000"
            icon={<Layers3 size={30} className="text-purple-300" />}
            description="Processes token fragmentation, reconstruction, and attack simulation state."
          />

          <AttackSurfaceCard
            accent="emerald"
            title="PostgreSQL Vaults"
            port="55432"
            icon={<Database size={30} className="text-emerald-300" />}
            description="Externally exposed demo port for isolated Fragment A, Fragment B, and Fragment C records."
          />
        </div>
      </section>

      {/* VAULT STATUS */}
      <section className="space-y-6">
        <div className="flex items-start gap-5">
          <div className="rounded-2xl bg-cyan-500/10 p-4">
            <Database size={36} className="text-cyan-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              Vault and Fragment Status
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Each vault stores only one XOR fragment. A compromised vault
              exposes only one fragment, not the complete API token.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <VaultStatusCard
            title="PostgreSQL Vault A"
            fragmentLabel="Fragment A"
            vault={vaults.vaultA}
          />

          <VaultStatusCard
            title="PostgreSQL Vault B"
            fragmentLabel="Fragment B"
            vault={vaults.vaultB}
          />

          <VaultStatusCard
            title="PostgreSQL Vault C"
            fragmentLabel="Fragment C"
            vault={vaults.vaultC}
          />
        </div>
      </section>

      {/* EXPLANATION */}
      <section className="rounded-3xl border border-emerald-500/40 bg-emerald-950/40 p-10 shadow-xl">
        <div className="flex items-start gap-5">
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <ShieldCheck size={38} className="text-emerald-400" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-emerald-400">
              Demo Explanation
            </h2>

            <p className="max-w-5xl text-sm leading-relaxed text-slate-300">
              FragVault does not claim that vault compromise or fragment
              interception is impossible. Instead, it reduces the impact of
              partial compromise. A single compromised vault exposes only one XOR
              fragment. One intercepted fragment, or even two fragments, cannot
              reconstruct the original API token. Reconstruction becomes possible
              only when all three corresponding fragments are exposed together.
            </p>
          </div>
        </div>
      </section>

      {/* EVENT TIMELINE */}
      <section className="space-y-6">
        <div className="flex items-start gap-5">
          <div className="rounded-2xl bg-cyan-500/10 p-4">
            <CheckCircle2 size={36} className="text-cyan-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-white">
              Attack Event Timeline
            </h2>

            <p className="max-w-5xl text-lg leading-relaxed text-slate-400">
              Identifies each live attempt by source, request method, endpoint,
              target, result, and timestamp. Events are stored persistently in
              the PostgreSQL audit database.
            </p>
          </div>
        </div>

        <EventTimeline events={events} />
      </section>
    </main>
  );
}

export default AttackSimulation;
