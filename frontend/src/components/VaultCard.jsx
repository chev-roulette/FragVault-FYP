import { motion } from "framer-motion";

import {
  Database,
  ShieldCheck,
  AlertTriangle,
  Clock3
} from "lucide-react";

function VaultCard({

  vaultName,
  status,
  fragments,
  integrity,
  latency,
  compromised,
  lastChecked,

}) {

  return (

    <motion.div

      whileHover={{ scale: 1.02 }}

      className={`rounded-3xl
        p-8
        border
        shadow-2xl
        transition

      ${
        compromised
          ? "bg-red-950 border-red-500"
          : "bg-[#111827] border-cyan-500"
      }`}

    >

      {/* Header */}
      <div className="flex
        items-center
        justify-between
        mb-8">

        <div className="flex
          items-center
          gap-4">

          <Database

            className={
              compromised
                ? "text-red-400"
                : "text-cyan-400"
            }

            size={40}

          />

          <h2 className="text-3xl font-bold">

            {vaultName}

          </h2>

        </div>


        {/* Status */}
        <div

          className={`font-bold
            text-lg

          ${
            compromised
              ? "text-red-400"
              : "text-green-400"
          }`}

        >

          ● {status}

        </div>

      </div>


      {/* Metrics */}
      <div className="space-y-5 text-lg">


        {/* Fragments */}
        <div className="flex justify-between">

          <span className="text-gray-400">

            Fragments Stored

          </span>

          <span className="font-bold">

            {fragments}

          </span>

        </div>


        {/* Integrity */}
        <div className="flex justify-between">

          <span className="text-gray-400">

            Integrity

          </span>

          <span className="font-bold">

            {integrity}%

          </span>

        </div>


        {/* Latency */}
        <div className="flex justify-between">

          <span className="text-gray-400">

            Latency

          </span>

          <span className="font-bold">

            {latency}ms

          </span>

        </div>


        {/* Last Checked */}
        <div className="flex justify-between items-center">

          <div className="flex items-center gap-2">

            <Clock3
              className="text-cyan-400"
              size={18}
            />

            <span className="text-gray-400">

              Last Checked

            </span>

          </div>

          <span className="font-bold text-cyan-400 text-sm">

            {lastChecked}

          </span>

        </div>

      </div>


      {/* Security State */}
      <div className="mt-8 flex items-center gap-3">

        {compromised ? (

          <>

            <AlertTriangle
              className="text-red-400"
            />

            <span className="text-red-400 font-semibold">

              Security Compromised

            </span>

          </>

        ) : (

          <>

            <ShieldCheck
              className="text-green-400"
            />

            <span className="text-green-400 font-semibold">

              Vault Secure

            </span>

          </>

        )}

      </div>

    </motion.div>

  );

}

export default VaultCard;