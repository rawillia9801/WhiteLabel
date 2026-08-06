import Link from "next/link";
import { ArrowRight, Check, Dog, FileSignature, Globe2, HeartPulse, MessageSquareText, MonitorSmartphone, PawPrint, PhoneCall, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import "./marketing.css";
import "./services.css";

const features = [
  [Dog, "Breeding operations", "Manage dogs, pedigrees, heat cycles, breedings, litters, whelping, and puppy records."],
  [UsersRound, "Families and placements", "Move applicants through approval, matching, contracts, payments, delivery, and follow-up."],
  [HeartPulse, "Health and care", "Keep vaccinations, medical records, registrations, weights, milestones, and documents organized."],
  [WalletCards, "Business control", "Track deposits, balances, payment plans, expenses, due dates, and every placement."],
  [FileSignature, "Documents and signatures", "Create agreements, retain signed records, and share them through secure Puppy Portals."],
  [MessageSquareText, "Communication center", "Coordinate updates, reminders, email, optional business voice, and messaging."],
] as const;

const plans = [
  ["Starter", "$29", "For growing breeding programs", ["Breeder workspace", "Kennel subdomain", "Family Puppy Portals", "Core records and workflows"]],
  ["Professional", "$59", "For active, established programs", ["Complete breeder workflow", "Advanced family operations", "Documents and automation", "Expanded business tools"]],
  ["Studio", "$99", "For a fully connected breeder brand", ["Everything in Professional", "Customizable breeder website", "Connected public puppy data", "Expanded operating capacity"]],
] as const;

const services = [
  [Globe2, "Brand Launch", "$149 one-time", "Launch an available standard .com under your brand.", ["First-year standard .com registration", "SSL and hosting configuration", "Two branded business email addresses", "Standard .com renewal: $29/year", "Premium domains priced separately"]],
  [MonitorSmartphone, "Custom Breeder Website", "$299 one-time", "A breeder website designed around your program when the Studio template is not enough.", ["Custom layout, branding, colors, and pages", "Your photography, content, and program presentation", "Connected MyDogPortal information", "Out-of-scope custom functionality quoted separately"]],
  [PhoneCall, "Business Voice", "$69 setup", "A professionally configured local business line with your greeting and breeder information.", ["Local number: $8.99/month or $99/year", "Incoming calls: $0.03/minute", "Outgoing calls: $0.04/minute", "IVR/menu, business hours, voicemail, and routing"]],
  [MessageSquareText, "Business SMS", "$59 activation", "Optional registered business messaging, separate from Business Voice and the software subscription.", ["$14.99/month per active registered campaign", "$25 activation per additional campaign", "Incoming: $0.02 per SMS segment", "Outgoing: $0.03 per SMS segment", "Approval required; allow up to 30 days"]],
] as const;

export default function MarketingPage() {
  return <main className="marketing-page">
    <nav className="marketing-nav" aria-label="Main navigation">
      <Link className="marketing-brand" href="/"><span><PawPrint size={21}/></span><b>MyDogPortal</b></Link>
      <div><a href="#platform">Platform</a><a href="#pricing">Pricing</a><Link href="/login">Sign in</Link><Link className="marketing-nav-cta" href="/signup">Start free trial</Link></div>
    </nav>
    <section className="marketing-hero">
      <div className="marketing-hero-copy">
        <span className="marketing-kicker"><ShieldCheck size={15}/> Built for professional dog breeders</span>
        <h1>Your breeding program.<br/><em>One connected system.</em></h1>
        <p>MyDogPortal brings breeding, families, health, finances, documents, communications, and buyer portals together under your own brand.</p>
        <div className="marketing-actions"><Link href="/signup">Start your 14-day free trial <ArrowRight size={17}/></Link><a href="#platform">Explore the platform</a></div>
        <small>No setup call required. Your private kennel workspace is ready when signup finishes.</small>
      </div>
      <div className="marketing-product">
        <header><span><PawPrint size={17}/></span><div><b>Willow Creek</b><small>Breeder workspace</small></div><i>LIVE</i></header>
        <section><small>TODAY&apos;S COMMAND CENTER</small><h2>Everything that needs your attention.</h2><div className="marketing-metrics"><span><b>3</b>Active litters</span><span><b>12</b>Puppies</span><span><b>5</b>Applications</span></div></section>
        <div className="marketing-product-list"><p><span>Breeding calendar</span><b>Two milestones this week</b></p><p><span>Family journey</span><b>Hazel is ready for matching</b></p><p><span>Payments</span><b>Three balances due</b></p></div>
      </div>
    </section>
    <section className="marketing-trust"><span><Globe2 size={17}/> Your kennel. Your colors. Your domain.</span><span><ShieldCheck size={17}/> Private tenant-isolated records</span><span><UsersRound size={17}/> Branded family experience</span></section>
    <section className="marketing-section" id="platform"><header><span className="marketing-kicker">THE COMPLETE BREEDER OPERATING SYSTEM</span><h2>Run the program. Serve the families. Protect the records.</h2><p>Replace disconnected spreadsheets, inboxes, folders, and payment notes with one operational source of truth.</p></header><div className="marketing-capabilities">{features.map(([Icon,title,text])=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="marketing-section marketing-pricing" id="pricing"><header><span className="marketing-kicker">SIMPLE MONTHLY PRICING</span><h2>Choose the workspace that fits your program.</h2><p>Every plan starts with a 14-day platform trial. Optional domains, websites, voice, and messaging remain separate.</p></header><div className="marketing-plans">{plans.map(([name,price,note,items])=><article className={name === "Professional" ? "featured" : ""} key={name}>{name === "Professional" && <em>MOST POPULAR</em>}<h3>{name}</h3><p><b>{price}</b><span>/month</span></p><small>{note}</small><ul>{items.map(item=><li key={item}><Check size={14}/>{item}</li>)}</ul><Link href="/signup">Start free trial <ArrowRight size={15}/></Link></article>)}</div></section>
    <section className="marketing-section marketing-services" id="services"><header><span className="marketing-kicker">OPTIONAL LAUNCH & COMMUNICATION SERVICES</span><h2>Add the business infrastructure your kennel needs.</h2><p>These services are separate from your MyDogPortal subscription. Request them during signup—no add-on payment is taken until the service is confirmed.</p></header><div className="marketing-service-grid">{services.map(([Icon,name,price,text,items])=><article key={name}><header><span><Icon size={21}/></span><div><h3>{name}</h3><strong>{price}</strong></div></header><p>{text}</p><ul>{items.map(item=><li key={item}><Check size={13}/>{item}</li>)}</ul><Link href="/signup">Add to my setup <ArrowRight size={15}/></Link></article>)}</div><aside><ShieldCheck size={18}/><p><b>Clear, separate billing.</b> Voice and SMS usage charges are billed separately from your software plan. SMS registration and carrier approval are required and activation is not guaranteed.</p></aside></section>
    <section className="marketing-final"><span><PawPrint size={25}/></span><div><small>MYDOGPORTAL</small><h2>Give your breeding program the operating system it deserves.</h2></div><Link href="/signup">Create your kennel workspace <ArrowRight size={17}/></Link></section>
    <footer className="marketing-footer"><Link className="marketing-brand" href="/"><span><PawPrint size={18}/></span><b>MyDogPortal</b></Link><p>White-label breeder operations and family portals.</p><div><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></div></footer>
  </main>;
}
