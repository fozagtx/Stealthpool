"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Link,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased custom-scrollbar">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const truncatedAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const navLinks = [
    { href: "/locations", label: "Create Intent" },
    { href: "/tips", label: "Match & Trade" },
  ];

  return (
    <>
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="xl"
        className={cn(
          "fixed top-0 z-50 border-b border-default-200/10",
          "bg-[#0a0a0f]/70 backdrop-blur-xl backdrop-saturate-150",
          "shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
        )}
        classNames={{
          wrapper: "px-4 md:px-8",
          base: "bg-transparent",
        }}
      >
        <NavbarBrand>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-green-500 shadow-lg shadow-purple-500/20">
              <Icon icon="solar:radar-2-linear" className="h-5 w-5 text-white" />
            </div>
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              <span className="gradient-text">ShadowPool</span>
            </Link>
          </motion.div>
        </NavbarBrand>

        <NavbarContent className="hidden md:flex gap-1" justify="center">
          {navLinks.map((link) => (
            <NavbarItem key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === link.href
                    ? "text-white bg-white/10 border border-white/10 shadow-lg shadow-purple-500/5"
                    : "text-default-500 hover:text-white hover:bg-white/5 border border-transparent"
                )}>
                {link.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <AnimatePresence mode="wait">
              {isConnected ? (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}>
                  <Button
                    size="sm" variant="flat"
                    className={cn(
                      "h-9 px-4 rounded-xl text-xs font-semibold",
                      "bg-gradient-to-r from-purple-500/10 to-green-500/10",
                      "border border-purple-500/20 text-white shadow-lg shadow-purple-500/5"
                    )}
                    onPress={() => disconnect()}
                    startContent={<div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20"><div className="h-2 w-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" /></div>}
                    endContent={<Icon icon="solar:alt-arrow-down-linear" className="h-4 w-4 text-default-400" />}>
                    {truncatedAddress}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="disconnected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}>
                  <Button
                    size="sm"
                    className={cn(
                      "h-9 px-4 rounded-xl text-xs font-semibold",
                      "bg-gradient-to-r from-purple-600 to-purple-500",
                      "text-white shadow-lg shadow-purple-500/25",
                      "hover:shadow-purple-500/40 hover:brightness-110 transition-all duration-200"
                    )}
                    onPress={() => connect({ connector: injected() })}
                    startContent={<Icon icon="solar:wallet-linear" className="h-4 w-4" />}>
                    Connect Wallet
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </NavbarItem>
          <NavbarMenuToggle className="md:hidden text-default-400" aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
        </NavbarContent>

        <NavbarMenu className={cn("pt-6 bg-[#0a0a0f]/95 backdrop-blur-xl backdrop-saturate-150 border-t border-default-200/10")}>
          {navLinks.map((link) => (
            <NavbarMenuItem key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "w-full py-3 px-4 rounded-xl text-base font-medium transition-all",
                  pathname === link.href ? "text-white bg-white/10 border border-white/10" : "text-default-500 hover:text-white hover:bg-white/5"
                )}
                onPress={() => setIsMenuOpen(false)}>
                <div className="flex items-center gap-3">
                  <Icon icon={link.href === "/locations" ? "solar:document-add-linear" : "solar:arrow-right-up-linear"} className="h-5 w-5 text-purple-400" />
                  {link.label}
                </div>
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <div className="mt-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-default-400" />
                <div>
                  <p className="text-xs text-default-500">Network</p>
                  <p className="text-sm font-medium text-white">Sepolia</p>
                </div>
              </div>
            </div>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <main className="relative pt-20 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </motion.div>
      </main>
    </>
  );
}
