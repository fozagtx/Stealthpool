"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  cn,
} from "@heroui/react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const features = [
  {
    icon: "solar:lock-keyhole-linear",
    title: "Fully Encrypted Intents",
    desc: "Your swap amounts and limit prices are encrypted client-side with Zama fhEVM. No plaintext ever leaves your device.",
    gradient: "from-purple-500/20 to-purple-500/5",
    border: "hover:border-purple-500/30",
  },
  {
    icon: "solar:eye-closed-linear",
    title: "Zero-Knowledge Matching",
    desc: "Match against other intents without revealing trade sizes. All computations happen on encrypted data.",
    gradient: "from-green-500/20 to-green-500/5",
    border: "hover:border-green-500/30",
  },
  {
    icon: "solar:shield-check-linear",
    title: "On-Chain Privacy",
    desc: "Only encrypted handles (euint128) are stored on-chain. Even the contract itself cannot see underlying values.",
    gradient: "from-blue-500/20 to-blue-500/5",
    border: "hover:border-blue-500/30",
  },
  {
    icon: "solar:flash-linear",
    title: "Private Settlement",
    desc: "Match amounts stay encrypted in storage. Only participants can decrypt trade details via the Zama relayer SDK.",
    gradient: "from-amber-500/20 to-amber-500/5",
    border: "hover:border-amber-500/30",
  },
];

const steps = [
  { step: "01", title: "Encrypt Intent", desc: "Your swap amount and minimum are encrypted client-side using Zama fhEVM before submission.", icon: "solar:lock-password-linear" },
  { step: "02", title: "Store On-Chain", desc: "Only encrypted handles (euint128) are stored on-chain. The contract itself is blind to the values.", icon: "solar:database-linear" },
  { step: "03", title: "Discover & Match", desc: "Others see intents exist but never the amounts. Encrypted match params pair against your intent.", icon: "solar:radar-2-linear" },
  { step: "04", title: "Private Settlement", desc: "Match amounts stay encrypted in storage. Only you decrypt via the Zama relayer SDK.", icon: "solar:handshake-linear" },
];

const stats = [
  { value: "$12.4M+", label: "Total Volume Private", icon: "solar:dollar-minimalistic-linear" },
  { value: "847", label: "Active Intents", icon: "solar:documents-minimalistic-linear" },
  { value: "2,391", label: "Matches Executed", icon: "solar:check-circle-linear" },
];


export default function Home() {
  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-green-600/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute -bottom-40 left-1/3 h-[350px] w-[350px] rounded-full bg-blue-600/8 blur-[90px] animate-pulse-glow" style={{ animationDelay: "3s" }} />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${5 + Math.random() * 90}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Hero */}
      <motion.div initial="initial" animate="animate" variants={stagger} className="relative pt-12 pb-8 md:pt-20 md:pb-12 text-center">
        <motion.div variants={fadeUp} className="flex justify-center gap-3 mb-6 flex-wrap">
          <Chip variant="flat" className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-3" startContent={<Icon icon="solar:bolt-linear" className="h-3.5 w-3.5" />}>
            Powered by Zama fhEVM
          </Chip>
          <Chip variant="flat" className="bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-semibold px-3" startContent={<Icon icon="solar:shield-minimalistic-linear" className="h-3.5 w-3.5" />}>
            Fully Encrypted
          </Chip>
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          <span className="gradient-text">Confidential</span><br />
          <span className="text-white">ShadowPool</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="text-default-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
          A privacy-preserving dark pool powered by{" "}
          <a href="https://zama.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">Zama fhEVM</a>.
          Create encrypted swap intents and match them confidentially — no one sees your trade size or limit price.
        </motion.p>

        <motion.div variants={fadeUp} className="flex gap-4 justify-center mt-10 flex-wrap">
          <Button as={Link} href="/locations" size="lg" className="h-12 px-8 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 transition-all duration-200" startContent={<Icon icon="solar:document-add-linear" className="h-5 w-5" />}>
            Create Intent
          </Button>
          <Button as={Link} href="/tips" size="lg" variant="flat" className="h-12 px-8 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-200" startContent={<Icon icon="solar:arrow-right-up-linear" className="h-5 w-5" />}>
            Match & Trade
          </Button>
        </motion.div>
      </motion.div>
      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-green-500/10">
              <Icon icon={stat.icon} className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-default-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
        {features.map((feature) => (
          <motion.div key={feature.title} variants={fadeUp}>
            <Card className={cn("group glass-card-hover p-0 overflow-hidden border border-default-200/10", feature.border)}>
              <CardBody className="p-6">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br mb-4", feature.gradient)}>
                  <Icon icon={feature.icon} className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-default-500 leading-relaxed">{feature.desc}</p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* How It Works */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-card p-8 md:p-10 mb-12">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Icon icon="solar:graph-new-linear" className="h-5 w-5 text-purple-400" />
          How It Works
        </h3>
        <p className="text-sm text-default-500 mb-10 max-w-xl">From intent creation to private settlement — your data stays encrypted at every step.</p>
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-purple-500/40 via-green-500/40 to-purple-500/40" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((item, idx) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="relative flex flex-col items-center md:items-start text-center md:text-left">
                <div className="relative mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20 z-10 relative">
                    <span className="text-sm font-bold text-white">{item.step}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping z-0" style={{ animationDuration: "3s" }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon={item.icon} className="h-4 w-4 text-purple-400" />
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                </div>
                <p className="text-xs text-default-500 leading-relaxed max-w-[260px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="pt-8 pb-4 border-t border-default-200/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-green-500">
              <Icon icon="solar:radar-2-linear" className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">ShadowPool</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="https://zama.ai" target="_blank" className="text-xs text-default-500 hover:text-purple-400 transition-colors">Zama fhEVM</Link>
            <Link href="https://wagmi.sh" target="_blank" className="text-xs text-default-500 hover:text-purple-400 transition-colors">wagmi</Link>
            <Link href="https://nextjs.org" target="_blank" className="text-xs text-default-500 hover:text-purple-400 transition-colors">Next.js</Link>
          </div>
          <p className="text-xs text-default-600">Built with Next.js 16 - wagmi - viem - @zama-fhe/relayer-sdk</p>
        </div>
      </footer>
    </div>
  );
}
