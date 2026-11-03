import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-center"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6">
        <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5 shadow-lg shadow-cyan-500/10">
          <ShieldCheck size={58} className="text-cyan-400" />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-cyan-400">
            FragVault API Token Storage
          </h1>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
            PostgreSQL-backed API token fragmentation system using XOR-based secret splitting to reduce vault compromise risk.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

export default HeroSection;