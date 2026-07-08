"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Card, CardBody, Button, Chip, cn } from "@heroui/react";
import Link from "next/link";

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };

const features = [
  { icon: "solar:lock-keyhole-linear", title: "Fully Encrypted Intents", desc: "Swap amounts encrypted client-side with Zama fhEVM. No plaintext leaves your device.", gradient: "from-purple-500/20 to-purple-500/5" },
  { icon: "solar:eye-closed-linear", title: "Zero-Knowledge Matching", desc: "Match intents without revealing trade sizes. All computations on encrypted data.", gradient: "from-green-500/20 to-green-500/5" },
  { icon: "solar:shield-check-linear", title: "On-Chain Privacy", desc: "Only euint128 handles stored on-chain. Contract itself can't see values.", gradient: "from-blue-500/20 to-blue-500/5" },
  { icon: "solar:flash-linear", title: "Private Settlement", desc: "Match amounts encrypted in storage. Only participants decrypt via Zama SDK.", gradient: "from-amber-500/20 to-amber-500/5" },
];

const steps = [
  { step: "01", title: "Encrypt Intent", desc: "Encrypted client-side with Zama fhEVM", icon: "solar:lock-password-linear" },
  { step: "02", title: "Store On-Chain", desc: "Only euint128 handles stored on-chain", icon: "solar:database-linear" },
  { step: "03", title: "Discover & Match", desc: "Match with encrypted params", icon: "solar:radar-2-linear" },
  { step: "04", title: "Private Settlement", desc: "Only you decrypt via Zama SDK", icon: "solar:handshake-linear" },
];

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* BG effects - hidden on mobile */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 hidden md:block">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-green-600/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Hero */}
      <section className="pt-8 sm:pt-16 pb-8 sm:pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Chip size="sm" variant="flat" className="mb-4 sm:mb-6 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Zama fhEVM — Sepolia
            </div>
          </Chip>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-4 sm:mb-6 px-2">
            Trade <span className="gradient-text">Privately</span>
            <br />
            <span className="text-white/70">On-Chain</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-default-500 max-w-xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0 leading-relaxed">
            Encrypted dark pool on Zama fhEVM. No MEV. No front-running.
            Your trade size stays encrypted — always.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link href="/locations" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40">
                <Icon icon="solar:document-add-linear" className="h-5 w-5" />
                Create Intent
              </Button>
            </Link>
            <Link href="/tips" className="w-full sm:w-auto">
              <Button size="lg" variant="flat" className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10">
                <Icon icon="solar:arrow-right-up-linear" className="h-5 w-5" />
                Match & Trade
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 px-2 sm:px-0">
        {features.map((f) => (
          <motion.div key={f.title} variants={fadeUp}>
            <Card className="glass-card-hover border border-default-200/10 h-full">
              <CardBody className="p-4 sm:p-5">
                <div className={"flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br " + f.gradient + " mb-3 sm:mb-4"}>
                  <Icon icon={f.icon} className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs sm:text-sm text-default-500 leading-relaxed">{f.desc}</p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* How It Works */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-card p-5 sm:p-8 md:p-10 mb-8 sm:mb-12">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Icon icon="solar:graph-new-linear" className="h-5 w-5 text-purple-400" />
          How It Works
        </h3>
        <p className="text-xs sm:text-sm text-default-500 mb-6 sm:mb-10 max-w-xl">From intent creation to private settlement — your data stays encrypted at every step.</p>
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-purple-500/40 via-green-500/40 to-purple-500/40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative">
            {steps.map((item, idx) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="relative flex flex-col items-center md:items-start text-center md:text-left">
                <div className="relative mb-4 sm:mb-5">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 z-10 relative">
                    <span className="text-xs sm:text-sm font-bold text-white">{item.step}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping z-0" style={{ animationDuration: "3s" }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon={item.icon} className="h-4 w-4 text-purple-400 shrink-0" />
                  <h4 className="text-sm sm:text-base font-semibold text-white">{item.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-default-500 leading-relaxed max-w-[260px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="pt-6 sm:pt-8 pb-4 border-t border-default-200/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-green-500">
              <Icon icon="solar:radar-2-linear" className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">StealthPool</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="https://zama.ai" target="_blank" className="text-xs text-default-500 hover:text-purple-400 transition-colors">Zama fhEVM</Link>
            <Link href="https://wagmi.sh" target="_blank" className="text-xs text-default-500 hover:text-purple-400 transition-colors">wagmi</Link>
            <Link href="https://nextjs.org" target="_blank" className="text-xs text-default-500 hover:text-purple-400 transition-colors">Next.js</Link>
          </div>
          <p className="text-[10px] sm:text-xs text-default-600">Built with Next.js 16 · wagmi · @zama-fhe/relayer-sdk</p>
        </div>
      </footer>
    </div>
  );
}
