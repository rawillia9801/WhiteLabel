import { cookies } from "next/headers";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { BREEDER_SESSION_COOKIE, readBreederSessionToken } from "../../lib/breeder-session";
import { authorizePlatformAdmin, loadPlatformAdminDashboard } from "../../lib/platform-admin";
import { PlatformAdminDashboard } from "../../components/platform-admin-dashboard";
import "./platform-admin.css";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const cookieStore = await cookies();
  const session = readBreederSessionToken(cookieStore.get(BREEDER_SESSION_COOKIE)?.value);
  if (!session) {
    return (
      <main className="platform-admin-gate">
        <div><ShieldAlert size={28} /><small>MYDOGPORTAL PLATFORM ADMIN</small><h1>Administrator sign-in required</h1><p>Sign in with the breeder owner account that has been assigned platform-administrator access.</p><Link href="/login?next=/platform-admin">Sign in</Link></div>
      </main>
    );
  }

  const access = await authorizePlatformAdmin(session);
  if (!access.allowed) {
    return (
      <main className="platform-admin-gate">
        <div><ShieldAlert size={28} /><small>MYDOGPORTAL PLATFORM ADMIN</small><h1>Platform access is restricted</h1><p>{access.reason}</p><Link href="/">Return to breeder workspace</Link></div>
      </main>
    );
  }

  const data = await loadPlatformAdminDashboard(access.email);
  return <PlatformAdminDashboard data={data} />;
}
