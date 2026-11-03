import { useEffect, useState } from "react";
import { Database, Clock3, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

import { getVaultStatus } from "../services/api";

function VaultStatus() {
  const [vaults, setVaults] = useState(null);

  const fetchVaultData = async () => {
    try {
      const data = await getVaultStatus();
      setVaults(data);
    } catch (error) {
      console.error("Failed to fetch vault status", error);

      setVaults({
        vaultA: {
          status: "OFFLINE",
          fragments: 0,
          storage: "PostgreSQL",
          last_checked: "Connection Lost",
        },
        vaultB: {
          status: "OFFLINE",
          fragments: 0,
          storage: "PostgreSQL",
          last_checked: "Connection Lost",
        },
        vaultC: {
          status: "OFFLINE",
          fragments: 0,
          storage: "PostgreSQL",
          last_checked: "Connection Lost",
        },
      });
    }
  };

  useEffect(() => {
    fetchVaultData();

    const interval = setInterval(() => {
      fetchVaultData();
    }, 5000);

    const handleVaultUpdate = () => {
      fetchVaultData();
    };

    window.addEventListener("vault-update", handleVaultUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("vault-update", handleVaultUpdate);
    };
  }, []);

  if (!vaults) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-lg text-slate-300">
        Loading PostgreSQL vault data...
      </div>
    );
  }

  const vaultList = [
    {
      key: "vaultA",
      name: "PostgreSQL Vault A",
      description: "Stores Fragment A for each API token.",
      data: vaults.vaultA,
    },
    {
      key: "vaultB",
      name: "PostgreSQL Vault B",
      description: "Stores Fragment B for each API token.",
      data: vaults.vaultB,
    },
    {
      key: "vaultC",
      name: "PostgreSQL Vault C",
      description: "Stores Fragment C for each API token.",
      data: vaults.vaultC,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {vaultList.map((vault) => {
          const isOffline = vault.data.status === "OFFLINE";

          return (
            <motion.div
              key={vault.key}
              whileHover={{ scale: 1.02 }}
              className={`rounded-3xl border p-8 shadow-2xl ${
                isOffline
                  ? "border-red-500/60 bg-red-950/60"
                  : "border-cyan-500/40 bg-slate-900/80"
              }`}
            >
              <div className="mb-8 flex items-start gap-5">
                <div
                  className={`rounded-2xl p-4 ${
                    isOffline ? "bg-red-500/10" : "bg-cyan-500/10"
                  }`}
                >
                  <Database
                    size={34}
                    className={isOffline ? "text-red-400" : "text-cyan-400"}
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    {vault.name}
                  </h2>

                  <p className="text-sm leading-relaxed text-slate-400">
                    {vault.description}
                  </p>
                </div>
              </div>

              <div className="space-y-5 text-base">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-slate-400">Status</span>

                  <span
                    className={`font-bold ${
                      isOffline ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {vault.data.status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6">
                  <span className="text-slate-400">Stored Fragments</span>

                  <span className="font-bold text-cyan-400">
                    {vault.data.fragments}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6">
                  <span className="text-slate-400">Storage Layer</span>

                  <span className="font-bold text-purple-400">
                    {vault.data.storage || "PostgreSQL"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock3 size={18} className="text-cyan-400" />
                    <span>Last Checked</span>
                  </div>

                  <span className="text-right text-sm font-semibold text-slate-300">
                    {vault.data.last_checked}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-950/60 px-5 py-4">
                {isOffline ? (
                  <>
                    <AlertTriangle size={22} className="text-red-400" />
                    <span className="font-semibold text-red-400">
                      Vault Unavailable
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={22} className="text-emerald-400" />
                    <span className="font-semibold text-emerald-400">
                      Vault Online
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-7">
        <h3 className="text-xl font-bold text-cyan-300">
          Compromise Containment
        </h3>

        <p className="mt-3 max-w-5xl text-sm leading-relaxed text-slate-300">
          Each PostgreSQL vault stores only one XOR fragment type. If one vault
          is compromised or one fragment is intercepted, the attacker still
          cannot reconstruct the original API token without the remaining
          fragments.
        </p>
      </div>
    </div>
  );
}

export default VaultStatus;