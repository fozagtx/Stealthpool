"use client";

import { useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { CONTRACT_ADDRESSES, STEALTH_POOL_ABI } from "../../lib/contracts";
import { createEncryptedInput } from "../../lib/zama";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Divider,
  Progress,
  Link,
  Tooltip,
  cn,
} from "@heroui/react";

export default function MatchTradePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();

  const [intentId, setIntentId] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const handleMatch = useCallback(async () => {
    if (!address || !intentId || !amountIn || !amountOut) return;
    setError("");
    setTxHash("");
    setIsEncrypting(true);
    try {
      const ca = CONTRACT_ADDRESSES.stealthPool;

      const encIn = await createEncryptedInput(ca, address);
      encIn.add128(parseInt(amountIn));
      const rIn = await encIn.encrypt();

      const encOut = await createEncryptedInput(ca, address);
      encOut.add128(parseInt(amountOut));
      const rOut = await encOut.encrypt();

      setIsEncrypting(false);
      setIsMatching(true);

      const tx = await writeContractAsync({
        address: ca as `0x${string}`,
        abi: STEALTH_POOL_ABI,
        functionName: "matchIntent",
        args: [
          intentId as `0x${string}`,
          rIn.handles[0],
          rIn.inputProof,
          rOut.handles[0],
          rOut.inputProof,
        ],
      });
      setTxHash(tx);
    } catch (err: any) {
      console.error("Match failed:", err);
      setError(err?.message || err?.shortMessage || "Transaction failed");
    } finally {
      setIsEncrypting(false);
      setIsMatching(false);
    }
  }, [address, intentId, amountIn, amountOut, writeContractAsync]);

  const isFormValid = intentId && amountIn && amountOut;
  const isLoading = isEncrypting || isMatching;
  const progressValue = isEncrypting ? 40 : isMatching ? 75 : 0;

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setIntentId(text);
    } catch {
      // clipboard access denied
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-purple-500/10 border border-green-500/10">
              <Icon icon="solar:arrow-right-up-linear" className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Match & Trade</h1>
          <p className="text-default-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            Connect your wallet to match against encrypted swap intents.
          </p>
          <Button size="lg" className="h-12 px-8 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200" onPress={() => connect({ connector: injected() })} startContent={<Icon icon="solar:wallet-linear" className="h-5 w-5" />}>
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-card border border-default-200/10 overflow-visible">
          <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Icon icon="solar:arrow-right-up-linear" className="h-5 w-5 text-green-400" />
                  Match Swap Intent
                </h1>
                <p className="text-sm text-default-500 mt-1">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <Button size="sm" variant="flat" className="h-8 px-3 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-default-400" onPress={() => disconnect()} startContent={<Icon icon="solar:logout-2-linear" className="h-3.5 w-3.5" />}>
                Disconnect
              </Button>
            </div>

            <div className="flex gap-2 mt-4">
              <Chip size="sm" variant="flat" className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Wallet Connected
                </div>
              </Chip>
              <Chip size="sm" variant="flat" className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px]">
                Sepolia
              </Chip>
            </div>
          </CardHeader>

          <CardBody className="px-6 pb-6 pt-5">
            <p className="text-xs text-default-500 mb-5 leading-relaxed">
              Enter the intent ID of an existing swap intent and provide your encrypted matching amounts. All values are encrypted client-side before submission.
            </p>

            <div className="space-y-4">
              <Input
                label="Intent ID (bytes32)"
                placeholder="0x..."
                type="text"
                value={intentId}
                onValueChange={setIntentId}
                variant="flat"
                size="sm"
                className="w-full"
                classNames={{
                  input: "text-white text-sm font-mono",
                  inputWrapper: "bg-white/5 border border-white/10 data-[hover=true]:bg-white/10 rounded-xl h-12",
                  label: "text-default-500 text-xs font-semibold uppercase tracking-wider",
                }}
                startContent={<Icon icon="solar:hashtag-linear" className="h-4 w-4 text-purple-400" />}
                endContent={
                  <Tooltip content="Paste from clipboard" placement="top" className="text-xs">
                    <button onClick={pasteFromClipboard} className="focus:outline-none" type="button">
                      <Icon icon="solar:clipboard-linear" className="h-4 w-4 text-default-400 hover:text-purple-400 transition-colors" />
                    </button>
                  </Tooltip>
                }
              />

              <Input
                label="Amount You Provide"
                placeholder="e.g., 500000"
                type="number"
                value={amountIn}
                onValueChange={setAmountIn}
                variant="flat"
                size="sm"
                className="w-full"
                classNames={{
                  input: "text-white text-sm",
                  inputWrapper: "bg-white/5 border border-white/10 data-[hover=true]:bg-white/10 rounded-xl h-12",
                  label: "text-default-500 text-xs font-semibold uppercase tracking-wider",
                }}
                startContent={<Icon icon="solar:arrow-up-linear" className="h-4 w-4 text-purple-400" />}
                description="Encrypted as euint128"
              />

              <Input
                label="Amount You Expect"
                placeholder="e.g., 1000000"
                type="number"
                value={amountOut}
                onValueChange={setAmountOut}
                variant="flat"
                size="sm"
                className="w-full"
                classNames={{
                  input: "text-white text-sm",
                  inputWrapper: "bg-white/5 border border-white/10 data-[hover=true]:bg-white/10 rounded-xl h-12",
                  label: "text-default-500 text-xs font-semibold uppercase tracking-wider",
                }}
                startContent={<Icon icon="solar:arrow-down-linear" className="h-4 w-4 text-green-400" />}
                description="Encrypted minimum you expect to receive"
              />
            </div>

            <Divider className="my-5 bg-white/5" />

            {isLoading && (
              <Progress
                size="sm"
                aria-label="Processing match..."
                value={progressValue}
                className="mb-4"
                classNames={{
                  indicator: "bg-gradient-to-r from-green-500 to-purple-500",
                  track: "bg-white/5",
                }}
              />
            )}

            <Button
              size="lg"
              className={cn(
                "w-full h-12 rounded-xl text-sm font-bold",
                "bg-gradient-to-r from-green-600 to-green-500",
                "text-white shadow-lg shadow-green-500/20",
                "hover:shadow-green-500/40 hover:brightness-110",
                "transition-all duration-200",
                isLoading && "opacity-80"
              )}
              onPress={handleMatch}
              isDisabled={!isFormValid || isLoading}
              startContent={isLoading ? undefined : <Icon icon="solar:arrow-right-up-linear" className="h-5 w-5" />}
            >
              {isEncrypting
                ? "Encrypting amounts..."
                : isMatching
                ? "Submitting match..."
                : "Match Intent"}
            </Button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <Icon icon="solar:danger-circle-linear" className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-300 mb-1">Match Failed</p>
                        <p className="text-xs text-red-400/80 leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Result */}
            <AnimatePresence>
              {txHash && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-4 rounded-xl bg-gradient-to-br from-green-500/10 to-purple-500/5 border border-green-500/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 shrink-0">
                        <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-green-300 mb-1">Match Submitted Successfully</p>
                        <p className="text-[11px] text-default-500 mb-3">
                          Your match has been submitted to the confidential shadow pool. Track it on-chain:
                        </p>
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                          <Icon icon="solar:link-linear" className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <Link
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-default-500 hover:text-purple-400 break-all transition-colors font-mono"
                          >
                            {txHash}
                          </Link>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Chip size="sm" variant="flat" className="bg-green-500/10 border border-green-500/20 text-green-300 text-[10px]">
                            <Icon icon="solar:shield-check-linear" className="h-3 w-3 mr-1" />
                            Encrypted
                          </Chip>
                          <Chip size="sm" variant="flat" className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
                            <Icon icon="solar:radar-2-linear" className="h-3 w-3 mr-1" />
                            Pending
                          </Chip>
                        </div>
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
