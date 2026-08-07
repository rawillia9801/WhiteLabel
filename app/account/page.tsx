import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BadgeDollarSign, ChevronLeft, CircleUserRound, CreditCard, FileText, Globe2, Mail, PackageCheck, Phone, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { BREEDER_SESSION_COOKIE, readBreederSessionToken } from "../../lib/breeder-session";
import { loadBreederAccount } from "../../lib/breeder-account";
import { AccountSignOut } from "../../components/account-sign-out";
import { SubscriptionCancelButton } from "../../components/subscription-cancel-button";
import "./account.css";

export const dynamic = "force-dynamic";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not scheduled";
const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";

export default async function BreederAccountPage() {
  const cookieStore = await cookies();
  const session = readBreederSessionToken(cookieStore.get(BREEDER_SESSION_COOKIE)?.value);
  if (!session) redirect("/login?next=/account");

  const account = await loadBreederAccount(session.kennelId);
  const trialActive = Boolean(account.subscription?.trialEndsAt && new Date(account.subscription.trialEndsAt).getTime() > Date.now());
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim() || "mydogportal.site";
  const workspaceAddress = `${account.kennel.slug}.${platform}`;

  return <main className="breeder-account">
    <aside className="account-rail">
      <header><span><CircleUserRound size={20}/></span><div><b>{account.kennel.name}</b><small>BREEDER ACCOUNT</small></div></header>
      <nav>
        <a href="#subscription"><CreditCard size={15}/> Subscription</a>
        <a href="#billing"><ReceiptText size={15}/> Billing & receipts</a>
        <a href="#services"><PackageCheck size={15}/> Add-ons</a>
        <a href="#profile"><CircleUserRound size={15}/> Kennel profile</a>
      </nav>
      <div className="account-rail-plan"><small>CURRENT PLAN</small><b>{account.kennel.plan}</b><span>{trialActive ? "14-day trial active" : account.subscription?.status || "Billing setup"}</span></div>
      <AccountSignOut/>
    </aside>

    <section className="account-main">
      <header className="account-topbar">
        <div><small>ACCOUNT CENTER</small><h1>Breeder profile & billing</h1><p>Manage your MyDogPortal subscription, receipts, services, and kennel account from one place.</p></div>
        <div><Link href="/"><ChevronLeft size={14}/> Back to kennel</Link><Link className="primary" href="/billing"><Sparkles size={14}/> Manage plan</Link></div>
      </header>

      <div className="account-content">
        <section className="account-summary">
          <article><span><ShieldCheck size={18}/></span><div><small>PLAN</small><b>{account.kennel.plan}</b><p>{trialActive ? `Free trial through ${date(account.subscription?.trialEndsAt || null)}` : "MyDogPortal subscription"}</p></div></article>
          <article><span><CreditCard size={18}/></span><div><small>BILLING STATUS</small><b>{account.checkoutPending ? "Checkout required" : account.subscription?.status || "Legacy account"}</b><p>{account.subscription?.nextBillingAt ? `Next billing ${date(account.subscription.nextBillingAt)}` : "No upcoming PayPal charge recorded"}</p></div></article>
          <article><span><ReceiptText size={18}/></span><div><small>PAYMENT HISTORY</small><b>{account.receipts.length}</b><p>{account.receipts.length === 1 ? "Recorded PayPal receipt" : "Recorded PayPal receipts"}</p></div></article>
          <article><span><PackageCheck size={18}/></span><div><small>ADD-ONS</small><b>{account.services.length}</b><p>Active breeder services</p></div></article>
        </section>

        <section className="account-card subscription-card" id="subscription">
          <header><div><small>SUBSCRIPTION</small><h2>Your MyDogPortal plan</h2><p>See the active subscription and review upgrades or downgrades.</p></div><span className={trialActive ? "status trial" : "status active"}>{trialActive ? "Trial active" : account.subscription?.status || "Active"}</span></header>
          <div className="subscription-grid">
            <div className="subscription-plan"><small>ACTIVE PLAN</small><strong>{account.kennel.plan}</strong><p>{account.subscription?.offering || "Existing MyDogPortal account"}</p>{account.subscription?.paypalId && <code>{account.subscription.paypalId}</code>}</div>
            <div><small>NEXT BILLING</small><b>{date(account.subscription?.nextBillingAt || null)}</b><p>{account.subscription ? `${money(account.subscription.amount)} scheduled by PayPal` : "No PayPal subscription recorded"}</p></div>
            <div><small>TRIAL</small><b>{trialActive ? "14 days free" : "—"}</b><p>{trialActive ? `Ends ${date(account.subscription?.trialEndsAt || null)}` : "Trial period complete or not applicable"}</p></div>
          </div>
          <footer className="subscription-footer"><div><b>Change or cancel anytime</b><span>Review plan options or cancel future recurring subscription billing here—no support ticket required.</span></div><div className="subscription-footer-actions"><Link href="/billing">Review plan options</Link>{account.subscription?.paypalId && <SubscriptionCancelButton/>}</div></footer>
        </section>

        <div className="account-two-column">
          <section className="account-card" id="billing">
            <header><div><small>BILLING & INVOICES</small><h2>Receipts & payment history</h2><p>PayPal transactions recorded for this kennel.</p></div><ReceiptText size={19}/></header>
            <div className="receipt-list">
              {account.receipts.slice(0, 12).map((receipt) => <article key={receipt.id}><span><FileText size={16}/></span><div><b>{receipt.title}</b><small>{receipt.kind} · {dateTime(receipt.date)}</small><code>{receipt.paypalId}</code></div><div><strong>{money(receipt.amount)}</strong><em>{receipt.status}</em></div></article>)}
              {!account.receipts.length && <div className="account-empty"><ReceiptText size={22}/><b>No receipts yet</b><span>Completed PayPal payments and purchases will appear here automatically.</span></div>}
            </div>
            <footer><a href="https://www.paypal.com/myaccount/autopay/" target="_blank" rel="noreferrer"><CreditCard size={14}/> PayPal billing settings</a><Link href="/billing"><BadgeDollarSign size={14}/> Billing & checkout</Link></footer>
          </section>

          <section className="account-card" id="services">
            <header><div><small>ADD-ONS & SERVICES</small><h2>Breeder services</h2><p>Recurring services connected to your kennel.</p></div><PackageCheck size={19}/></header>
            <div className="service-list">
              {account.services.map((service) => <article key={service.id}><span><PackageCheck size={16}/></span><div><b>{service.name}</b><small>{service.nextBillingAt ? `Next billing ${date(service.nextBillingAt)}` : "Active PayPal service"}</small></div><strong>{money(service.price)}</strong></article>)}
              {!account.services.length && <div className="account-empty"><PackageCheck size={22}/><b>No standalone add-ons</b><span>Hosting, Brand Launch, Business Voice and website services can be added as needed.</span></div>}
            </div>
            <footer><Link href="/billing#addons"><Sparkles size={14}/> Browse add-ons</Link></footer>
          </section>
        </div>

        <section className="account-card profile-card" id="profile">
          <header><div><small>KENNEL PROFILE</small><h2>{account.kennel.name}</h2><p>Your breeder workspace identity and public connection.</p></div><CircleUserRound size={20}/></header>
          <div className="profile-grid">
            <div><span><Globe2 size={15}/></span><p><small>WORKSPACE</small><b>{workspaceAddress}</b>{account.kennel.customDomain && <em>{account.kennel.customDomain} · {account.kennel.domainStatus || "configured"}</em>}</p></div>
            <div><span><Mail size={15}/></span><p><small>EMAIL</small><b>{account.kennel.contactEmail || "Not added"}</b></p></div>
            <div><span><Phone size={15}/></span><p><small>PHONE</small><b>{account.kennel.contactPhone || "Not added"}</b></p></div>
            <div><span><CircleUserRound size={15}/></span><p><small>BREED / LOCATION</small><b>{[account.kennel.primaryBreed, account.kennel.location].filter(Boolean).join(" · ") || "Complete your kennel profile"}</b></p></div>
          </div>
          <footer><Link href="/settings/branding">Brand & website settings</Link><Link href="/settings/domain">Domain settings</Link></footer>
        </section>
      </div>
    </section>
  </main>;
}
