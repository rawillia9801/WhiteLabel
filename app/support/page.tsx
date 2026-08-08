import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BreederSupportDesk } from "../../components/breeder-support-desk";
import { BREEDER_SESSION_COOKIE, readBreederSessionToken } from "../../lib/breeder-session";
import "./support.css";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const cookieStore = await cookies();
  const session = readBreederSessionToken(cookieStore.get(BREEDER_SESSION_COOKIE)?.value);
  if (!session) redirect("/login?next=/support");
  return <BreederSupportDesk kennelName={session.kennelName} />;
}
