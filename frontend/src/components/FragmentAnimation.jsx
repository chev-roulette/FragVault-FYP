import { motion } from "framer-motion";

import {
  Database,
  ShieldCheck,
  Server,
  User
} from "lucide-react";

function FragmentAnimation({ tokens }) {

  if (!tokens || tokens.length === 0) return null;

  // Generate fragmented data
  const fragmentedData = tokens.map((item) => {

    const token = item.token;

    return {

      service: item.service,

      environment: item.environment,

      owner: item.owner,

      vaultA: token.slice(0, 6),

      vaultB: token.slice(6, 12),

      vaultC: token.slice(12),

    };

  });

  return (

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-20"
    >

      {/* Dashboard Title */}
      <div className="text-center mb-12">

        <h2 className="text-5xl font-bold text-cyan-400">
          Distributed Vault Fragmentation
        </h2>

        <p className="text-gray-400 mt-4 text-lg">
          Enterprise Credential Fragment Allocation Matrix
        </p>

      </div>

      {/* Matrix Container */}
      <div className="overflow-x-auto">

        <div className="min-w-300 grid grid-cols-6 gap-4">

          {/* SERVICE HEADER */}
          <div className="bg-[#111827] border border-cyan-500 rounded-2xl h-36 flex items-center justify-center">

            <div className="flex flex-col items-center justify-center">

              <ShieldCheck
                className="text-cyan-400 mb-3"
                size={34}
              />

              <span className="font-bold text-cyan-400 text-3xl">
                Service
              </span>

            </div>

          </div>

          {/* ENVIRONMENT HEADER */}
          <div className="bg-[#111827] border border-cyan-500 rounded-2xl h-36 flex items-center justify-center">

            <div className="flex flex-col items-center justify-center">

              <Server
                className="text-cyan-400 mb-3"
                size={34}
              />

              <span className="font-bold text-cyan-400 text-3xl">
                Environment
              </span>

            </div>

          </div>

          {/* OWNER HEADER */}
          <div className="bg-[#111827] border border-cyan-500 rounded-2xl h-36 flex items-center justify-center">

            <div className="flex flex-col items-center justify-center">

              <User
                className="text-cyan-400 mb-3"
                size={34}
              />

              <span className="font-bold text-cyan-400 text-3xl">
                Owner
              </span>

            </div>

          </div>

          {/* VAULT A HEADER */}
          <div className="bg-[#111827] border border-purple-500 rounded-2xl h-36 flex items-center justify-center">

            <div className="flex flex-col items-center justify-center">

              <Database
                className="text-purple-400 mb-3"
                size={34}
              />

              <span className="font-bold text-white text-3xl">
                Vault A
              </span>

            </div>

          </div>

          {/* VAULT B HEADER */}
          <div className="bg-[#111827] border border-green-500 rounded-2xl h-36 flex items-center justify-center">

            <div className="flex flex-col items-center justify-center">

              <Database
                className="text-green-400 mb-3"
                size={34}
              />

              <span className="font-bold text-white text-3xl">
                Vault B
              </span>

            </div>

          </div>

          {/* VAULT C HEADER */}
          <div className="bg-[#111827] border border-pink-500 rounded-2xl h-36 flex items-center justify-center">

            <div className="flex flex-col items-center justify-center">

              <Database
                className="text-pink-400 mb-3"
                size={34}
              />

              <span className="font-bold text-white text-3xl">
                Vault C
              </span>

            </div>

          </div>

          {/* DATA ROWS */}
          {fragmentedData.map((item, index) => (

            <>

              {/* SERVICE */}
              <motion.div
                key={`${index}-service`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0f172a] border border-gray-700 rounded-xl p-4 flex items-center justify-center font-semibold text-lg"
              >
                {item.service}
              </motion.div>

              {/* ENVIRONMENT */}
              <motion.div
                key={`${index}-environment`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0f172a] border border-gray-700 rounded-xl p-4 flex items-center justify-center text-cyan-400 font-semibold text-lg"
              >
                {item.environment}
              </motion.div>

              {/* OWNER */}
              <motion.div
                key={`${index}-owner`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0f172a] border border-gray-700 rounded-xl p-4 flex items-center justify-center text-gray-300 text-center"
              >
                {item.owner}
              </motion.div>

              {/* VAULT A */}
              <motion.div
                key={`${index}-a`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-purple-500 rounded-xl p-4 text-center font-bold shadow-lg"
              >
                {item.vaultA}
              </motion.div>

              {/* VAULT B */}
              <motion.div
                key={`${index}-b`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.1 }}
                className="bg-green-500 rounded-xl p-4 text-center font-bold shadow-lg"
              >
                {item.vaultB}
              </motion.div>

              {/* VAULT C */}
              <motion.div
                key={`${index}-c`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="bg-pink-500 rounded-xl p-4 text-center font-bold shadow-lg"
              >
                {item.vaultC}
              </motion.div>

            </>

          ))}

        </div>

      </div>

    </motion.div>

  );
}

export default FragmentAnimation;