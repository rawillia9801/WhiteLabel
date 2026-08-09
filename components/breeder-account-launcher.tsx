"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, CircleUserRound } from "lucide-react";
import { useTenant } from "./tenant-runtime";

const hiddenPrefixes = ["/account", "/support", "/billing", "/login", "/signup", "/platform-admin", "/templates", "/portal"];

export function BreederAccountLauncher() {
  const pathname = usePathname();
  const tenant = useTenant();
  if (hiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;

  return <Link className="breeder-account-launcher" href="/account" aria-label="Open breeder profile, billing, receipts, subscription changes, and support">
    <span className="breeder-account-launcher-icon"><CircleUserRound size={18}/></span>
    <span className="breeder-account-launcher-copy"><b>Breeder Profile</b><small>{tenant.name} · billing · receipts · support</small></span>
    <ChevronRight size={15}/>
  </Link>;
}
