"use client";

import { useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { CONTRACT_ADDRESSES, STEALTH_POOL_ABI } from "../../lib/contracts";
import { createEncryptedInput } from "../../lib/zama";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Progress, Link, cn } from "@heroui/react";

const TOKENS = [
  { value: "0x0000000000000000000000000000000000000000", label: "ETH (Native)" },
  { value: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", label: "UNI" },
  { value: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", label: "USDC" },
  { value: "0x6b175474e89094c44da98b954eedeac495271d0f", label: "DAI" },
  { value: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", label: "WETH" },
];

export default function CreateIntentPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();

  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [minOut, setMinOut] = useState("");
  const [deadline, setDeadline] = useState("1");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateIntent = useCallback(async () => {
    if (!address || !tokenIn || !tokenOut || !amountIn || !minOut) return;
    setError(""); setTxHash("");
    setIsEncrypting(true);
    try {
      const ca = CONTRACT_ADDRESSES.stealthPool;
      const amtInt = parseInt(amountIn);
      const minInt = parseInt(minOut);
      const dl = Math.floor(Date.now() / 1000) + parseInt(deadline) * 3600;
      const encAmt = await createEncryptedInput(ca, address);
      encAmt.add128(amtInt);
      const rAmt = await encAmt.encrypt();
      const encMin = await createEncryptedInput(ca, address);
      encMin.add128(minInt);
      const rMin = await encMin.encrypt();
      setIsEncrypting(false); setIsCreating(true);
      const tx = await writeContractAsync({
        address: ca as `0x${string}`,
        abi: STEALTH_POOL_ABI,
        functionName: "createIntent",
        args: [tokenIn as `0x${string}`, tokenOut as `0x${string}`, rAmt.handles[0], rAmt.inputProof, rMin.handles[0], rMin.inputProof, dl],
      });
      setTxHash(tx);
    } catch (err: any) {
      setError(err?.message || err?.shortMessage || "Transaction failed");
    } finally {
      setIsEncrypting(false); setIsCreating(false);
    }
  }, [address, tokenIn, tokenOut, amountIn, minOut, deadline, writeContractAsync]);

  const isFormValid = tokenIn && tokenOut && amountIn && minOut;
  const isLoading = isEncrypting || isCreating;
  const progressValue = isEncrypting ? 40 : isCreating ? 75 : 0;

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center pt-8 sm:pt-16 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-green-500/10 border border-purple-500/10">
              <Icon icon="solar:document-add-linear" className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Create Swap Intent</h1>
          <p className="text-default-500 text-xs sm:text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            Connect your wallet to create a private swap intent with encrypted amounts.
          </p>
          <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-xl shadow-purple-500/25" onPress={() => connect({ connector: injected() })} startContent={<Icon icon="solar:wallet-linear" className="h-5 w-5" />}>
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-card border border-default-200/10 overflow-visible">
          <CardHeader className="flex flex-col items-start px-4 sm:px-6 pt-5 sm:pt-6 pb-0">
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Icon icon="solar:document-add-linear" className="h-5 w-5 text-purple-400 shrink-0" />
                  <span className="hidden sm:inline">Create Swap Intent</span>
                  <span className="sm:hidden">New Intent</span>
                </h1>
                <p className="text-xs sm:text-sm text-default-500 mt-0.5">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <Button size="sm" variant="flat" className="h-8 px-3 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-default-400" onPress={() => disconnect()} startContent={<Icon icon="solar:logout-2-linear" className="h-3.5 w-3.5" />}>
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
              <Chip size="sm" variant="flat" className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Connected
                </div>
              </Chip>
              <Chip size="sm" variant="flat" className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px]">Sepolia</Chip>
            </div>
          </CardHeader>
          <CardBody className="px-4 sm:px-6 pb-5 sm:pb-6 pt-4 sm:pt-5">
            <p className="text-xs text-default-500 mb-4 sm:mb-5 leading-relaxed">
              Submit a private swap intent with encrypted amounts. Your trade size and minimum are hidden from everyone.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <Select label="Token to Sell" placeholder="Select token" selectedKeys={tokenIn ? [tokenIn] : []} onSelectionChange={(keys) => { const val = Array.from(keys)[0]; setTokenIn(val?.toString() || ""); }} className="w-full" size="sm" classNames={{ trigger: "bg-white/5 border border-white/10 rounded-xl h-10 sm:h-12 text-sm" }}>
                {TOKENS.map((t) => <SelectItem key={t.value}>{t.label}</SelectItem>)}
              </Select>
              <Select label="Token to Buy" placeholder="Select token" selectedKeys={tokenOut ? [tokenOut] : []} onSelectionChange={(keys) => { const val = Array.from(keys)[0]; setTokenOut(val?.toString() || ""); }} className="w-full" size="sm" classNames={{ trigger: "bg-white/5 border border-white/10 rounded-xl h-10 sm:h-12 text-sm" }}>
                {TOKENS.map((t) => <SelectItem key={t.value}>{t.label}</SelectItem>)}
              </Select>
              <Input label="Amount to Sell" placeholder="e.g. 1000000" type="number" value={amountIn} onValueChange={setAmountIn} size="sm" className="w-full" classNames={{ input: "text-sm", inputWrapper: "bg-white/5 border border-white/10 rounded-xl h-10 sm:h-12" }} startContent={<Icon icon="solar:arrow-up-linear" className="h-4 w-4 text-default-400" />} />
              <Input label="Min Amount to Receive" placeholder="e.g. 500000" type="number" value={minOut} onValueChange={setMinOut} size="sm" className="w-full" classNames={{ input: "text-sm", inputWrapper: "bg-white/5 border border-white/10 rounded-xl h-10 sm:h-12" }} startContent={<Icon icon="solar:arrow-down-linear" className="h-4 w-4 text-default-400" />} />
              <Input label="Deadline (hours)" placeholder="e.g. 1" type="number" value={deadline} onValueChange={setDeadline} size="sm" className="w-full" classNames={{ input: "text-sm", inputWrapper: "bg-white/5 border border-white/10 rounded-xl h-10 sm:h-12" }} startContent={<Icon icon="solar:clock-circle-linear" className="h-4 w-4 text-default-400" />} />
            </div>
            {isLoading && <Progress size="sm" aria-label="Creating..." value={progressValue} className="mt-4" classNames={{ indicator: "bg-gradient-to-r from-purple-500 to-green-500", track: "bg-white/5" }} />}
            <Button size="lg"
              className={cn("w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200 mt-4", isLoading && "opacity-80")}
              onPress={handleCreateIntent}
              isDisabled={!isFormValid || isLoading}
              startContent={isLoading ? undefined : <Icon icon="solar:lock-keyhole-linear" className="h-5 w-5" />}
            >
              {isEncrypting ? "Encrypting..." : isCreating ? "Submitting..." : "Create Encrypted Intent"}
            </Button>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-3 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Icon icon="solar:danger-circle-linear" className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-red-300 mb-1">Failed</p>
                        <p className="text-xs text-red-400/80 break-words">{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {txHash && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-3 p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Icon icon="solar:check-circle-linear" className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-300 mb-1">Intent Created</p>
                        <Link href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-default-500 hover:text-purple-400 break-all transition-colors">{txHash}</Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
