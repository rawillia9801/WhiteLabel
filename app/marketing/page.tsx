import Link from "next/link";
import {
  ArrowRight,
  Check,
  Dog,
  ExternalLink,
  FileSignature,
  Globe2,
  HeartPulse,
  MessageSquareText,
  MonitorSmartphone,
  PawPrint,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import "./marketing.css";
import "./services.css";
import { FOUNDING_BREEDER_LIMIT, foundingPricingStatus } from "../../lib/founding-pricing";

export const dynamic = "force-dynamic";

const features = [
  [Dog, "Breeding operations", "Manage dogs, pedigrees, heat cycles, breedings, litters, whelping, puppies, and program milestones."],
  [UsersRound, "Families and placements", "Move applicants through approval, waitlists, matching, placement, go-home, and follow-up without rebuilding the family record."],
  [HeartPulse, "Health and care", "Keep vaccinations, medical records, registrations, weights, medications, milestones, and care history organized."],
  [WalletCards, "Business control", "Track deposits, balances, payment plans, expenses, due dates, and the financial history behind every placement."],
  [MonitorSmartphone, "Private Puppy Portals", "Give each family a breeder-branded place for puppy information, updates, health records, documents, payments, messages, and go-home details."],
  [MessageSquareText, "Automation and communication", "Coordinate application acknowledgements, reminders, family updates, milestone communication, and operational alerts from the breeder record."],
] as const;

const featureModules = [
  [Dog, "BREEDING INTELLIGENCE", "Professional + Studio", "Pedigrees, genetics & planned matings", "Move beyond a dog list. Keep lineage and breeding decisions connected to the dogs they affect.", ["3–5 generation pedigree workspace", "COI / inbreeding calculation", "Common-ancestor identification", "Planned and test matings", "Genetic carrier information", "Pairing context kept with each dog"]],
  [HeartPulse, "REPRODUCTIVE MANAGEMENT", "Professional + Studio", "From heat cycle to due date", "Keep reproductive history and the current breeding timeline in one operational record.", ["Heat-cycle history", "Predicted next heat", "Progesterone tests and results", "Breeding dates and pairing attempts", "Estimated due date", "Pregnancy milestones", "Whelping countdown", "Automatic reminders"]],
  [Dog, "WHELPING MODE", "Professional + Studio", "A working screen for the hours that matter", "Capture each newborn as the litter arrives and continue monitoring growth after delivery.", ["Birth time, sex and color / markings", "Collar color and birth weight", "Placenta and nursing status", "Daily weight tracking", "Weight-loss warnings", "Dewormings and vaccinations", "Medications and care notes"]],
  [HeartPulse, "BREEDING CALENDAR", "Professional + Studio", "Let breeding dates build the timeline", "Turn recorded breeding activity into visible upcoming work instead of calculating every milestone by hand.", ["Breeding and due-date timeline", "Pregnancy and whelping milestones", "Upcoming care work", "Program reminders", "Attention items", "Calendar-driven command center"]],
  [UsersRound, "WAITLIST + PUPPY PICKING", "Professional + Studio", "Make the family list operational", "Manage who is waiting, what they want, where they rank, and what happens when selection begins.", ["Family ranking", "Deposit received status", "Male / female preference", "Color and litter preference", "Picking order", "Puppy assignment", "Pass / skip handling", "Move family to the next litter"]],
  [UsersRound, "APPLICATIONS + PLACEMENT", "All plans", "One family record from application forward", "Keep applicant information useful after approval instead of re-entering the same family over and over.", ["Application review and status", "Buyer / family record", "Litter and puppy matching", "Placement milestones", "Go-home readiness", "Pickup and delivery coordination"]],
  [HeartPulse, "PUPPY HEALTH + GROWTH", "All plans", "A record that grows with the puppy", "Organize the health, growth, care, and milestone information breeders and families need later.", ["Weights and growth history", "Vaccinations and dewormings", "Medications and veterinary notes", "Registrations and health documents", "Milestones and care history", "Family-facing health information"]],
  [WalletCards, "FINANCIAL CONTROL", "All plans", "Know what was paid, what is due, and why", "MyDogPortal tracks breeder business records; puppy-sale payments remain between the breeder and their families.", ["Deposits and balances", "Payment history", "Payment plans and due dates", "Expenses", "Placement financial history", "Outstanding-balance visibility"]],
  [MessageSquareText, "AUTOMATION + COMMUNICATION", "Professional + Studio", "Follow-up that follows the record", "Automate routine breeder administration while keeping communication tied to the right family, puppy, and milestone.", ["Application acknowledgements", "Approval notifications", "Payment reminders", "Milestone-triggered updates", "Family update workflows", "Automated breeder email", "Operational alerts and reminders"]],
  [MonitorSmartphone, "PRIVATE PUPPY PORTAL", "All plans", "Give every family one organized place to return", "Each placed family can receive a private, breeder-branded experience containing only the information intended for them.", ["Overview and My Puppy", "Health & Growth", "Updates", "Documents", "Payments", "Schedule", "Pickup & Delivery", "Messages", "Resources and account access"]],
  [FileSignature, "DOGBREEDERDOCS CONNECTION", "Professional + Studio", "Professional breeder paperwork without duplicate entry", "Professional and Studio include DogBreederDocs and connect its document workflow to the family and puppy information already maintained in MyDogPortal.", ["DogBreederDocs document library included", "Bill of Sale and puppy paperwork workflows", "Deposit, placement and payment-plan documents", "State-aware document selection", "E-signature workflow", "Completed copies retained with the family record"]],
  [Globe2, "CONNECTED PRODUCT SUITE", "Studio", "MyDogPortal + DogBreederWeb + DogBreederDocs", "Studio combines the breeder operating system with the connected website and document products, while each product keeps a clear job of its own.", ["Complete DogBreederWeb website plan included", "Standard .com domain, managed hosting and SSL", "Two branded business email addresses", "Connected puppy, litter and application publishing", "DogBreederDocs included", "Business Voice included", "$20/month in Phone System Credits", "One connected breeder-to-family journey"]],
] as const;

const plans = [
  ["Starter", "$29", "$290", "GET ORGANIZED", "For growing programs that need one secure place to run the essentials.", ["Private breeder workspace", "Included kennel workspace address", "Dogs, litters and puppy records", "Applications and family records", "Family Puppy Portals", "Puppy health and growth records", "Vaccinations, dewormings and care history", "Deposits, balances and payment history", "Family messages and breeder updates", "Core calendar and attention items", "Secure tenant-isolated records"]],
  ["Professional", "$69", "$690", "RUN YOUR BREEDING BUSINESS", "For active breeders who want the complete breeding, placement, document, and automation workflow.", ["Everything in Starter", "3–5 generation pedigrees", "COI / inbreeding and common-ancestor tools", "Planned and test matings", "Genetic carrier information", "Heat-cycle and progesterone tracking", "Breeding attempts, due dates and pregnancy milestones", "Whelping Mode + newborn tracking", "Daily weights and weight-loss warnings", "Automated breeding calendar and reminders", "Operational waitlist + puppy-picking order", "DogBreederDocs included", "Connected document generation + e-signatures", "Automated application, payment and milestone emails", "Advanced placement, go-home and business tools"]],
  ["Studio", "$119", "$1,190", "THE CONNECTED BREEDER SUITE", "For breeders who want the operating system, public website, documents, and business presence connected together.", ["Everything in Professional", "Complete DogBreederWeb website plan included", "AI-assisted breeder website workspace", "Connected public puppy and litter information", "Standard .com domain included", "Managed website hosting + SSL", "Two branded business email addresses", "DogBreederDocs included and connected", "Business Voice included", "$20/month in Phone System Credits", "Website → application → MyDogPortal → documents → Puppy Portal workflow", "Standard .com renewal included while Studio remains active", "Studio subscription rate locked while continuously active"]],
] as const;

const foundingPrices = {
  Starter: ["$19", "$190"],
  Professional: ["$39", "$390"],
  Studio: ["$69", "$690"],
} as const;

const workflow = [
  [UsersRound, "01", "Application arrives", "Keep the family, application answers, contact information, and review status together from the beginning."],
  [Dog, "02", "Review & match", "Move an approved family into waitlist and matching, then connect the right puppy without rebuilding the record somewhere else."],
  [FileSignature, "03", "Prepare the paperwork", "Professional and Studio can pass the family and puppy information into the connected DogBreederDocs workflow instead of retyping it."],
  [WalletCards, "04", "Track the money", "Record deposits, balances, payment plans, due dates, expenses, and the financial history behind each placement."],
  [Globe2, "05", "Coordinate go-home", "Keep pickup, delivery, required forms, payment readiness, and final handoff details visible before release."],
  [HeartPulse, "06", "Continue in Puppy Portal", "Give the family one branded place for updates, documents, health records, messages, milestones, and next steps."],
] as const;

const automationCards = [
  [MessageSquareText, "AUTOMATED COMMUNICATION", "Send the right update at the right moment", "Application acknowledgements, approval notices, payment reminders, puppy milestones, and family updates can follow the workflow instead of living on a handwritten follow-up list.", "Fewer forgotten follow-ups"],
  [FileSignature, "CONNECTED DOCUMENTS", "Let DogBreederDocs use information you already captured", "Professional and Studio connect the DogBreederDocs workflow to the breeder, family, and puppy record so paperwork is a continuation of the process, not another disconnected product to manage.", "Less duplicate entry"],
  [UsersRound, "FAMILY EXPERIENCE", "A Puppy Portal that stays useful after the deposit", "Families can return to one private, breeder-branded experience for documents, puppy updates, requests, payment information, health and growth records, and go-home preparation.", "Private family access"],
  [Globe2, "CONNECTED WEBSITE", "Let DogBreederWeb handle the public website", "Studio connects DogBreederWeb to MyDogPortal so public puppy, litter, application, and breeder information can flow into the operating workflow without MyDogPortal pretending to be a second website storefront.", "Clear product boundaries"],
] as const;

const valueStack = [
  [UsersRound, "Applications", "Bring applicant answers and family records into the same workflow that follows them after approval."],
  [Dog, "Breeder records", "Keep dogs, litters, puppies, breeding activity, health, and placement context connected."],
  [FileSignature, "DogBreederDocs", "Professional and Studio connect breeder paperwork and e-signature workflows to the family and puppy record."],
  [WalletCards, "Payment tracking", "Keep deposits, balances, payment plans, due dates, and placement records visible together."],
  [HeartPulse, "Puppy Portal", "Give each family one branded place for their puppy, updates, health information, documents, and next steps."],
  [MessageSquareText, "Automation + email", "Let acknowledgements, reminders, milestones, and family updates follow the operational record."],
] as const;

const faqs = [
  ["What is MyDogPortal?", "MyDogPortal is the breeder operating system. It manages the private operational side of a breeding program: dogs, breedings, litters, puppies, applications, families, placements, health, finances, communication, automation, and Puppy Portals."],
  ["Does MyDogPortal build breeder websites?", "DogBreederWeb.Site is the dedicated website product. You can use MyDogPortal with your existing website, purchase DogBreederWeb separately, or choose Studio, which includes the connected DogBreederWeb website plan."],
  ["Where do breeder documents live?", "DogBreederDocs.Online is the dedicated breeder-document product. Professional and Studio include DogBreederDocs and connect its document workflow to the family and puppy information in MyDogPortal."],
  ["Can I buy DogBreederWeb or DogBreederDocs without MyDogPortal?", "Yes. Both are standalone products with their own websites. MyDogPortal becomes more powerful when they are connected, but the products do not have to be purchased as one bundle."],
  ["What exactly does Studio include?", "Studio includes the complete MyDogPortal Professional operating system, DogBreederWeb website plan with a standard .com domain, managed hosting, SSL and two branded business email addresses, DogBreederDocs, Business Voice, and $20/month in Phone System Credits. The products remain distinct, but the workflow is connected."],
  ["Can families see my private breeder records?", "No. Breeder operations stay private. Puppy Portals are family-facing experiences that expose only the information and documents intended for that family."],
  ["Does MyDogPortal process puppy purchases?", "No. MyDogPortal organizes breeder business records and family workflows. Your puppy sales and payment arrangements remain between your breeding program and your families."],
  ["How does Founding Breeder pricing work?", "The first 100 eligible kennel accounts can receive the introductory Founding rate. That rate stays locked while the subscription remains continuously active. If the subscription is cancelled or allowed to lapse, the Founding rate is forfeited and any later subscription uses the then-current published price."],
  ["Can I cancel without contacting support?", "Yes. MyDogPortal is designed for easy self-service cancellation from your breeder account. You do not need to call, email, or open a support ticket just to cancel your software subscription."],
] as const;

export default async function MarketingPage() {
  const founding = await foundingPricingStatus().catch(() => ({ limit: FOUNDING_BREEDER_LIMIT, claimed: 0, remaining: FOUNDING_BREEDER_LIMIT, available: true, eligible: true }));

  return <main className="marketing-page">
    <nav className="marketing-nav" aria-label="Main navigation">
      <Link className="marketing-brand" href="/"><span className="marketing-brand-mark"><PawPrint size={23}/></span><b>MyDogPortal</b></Link>
      <div><a href="#platform">Platform</a><a href="#features">Features</a><a href="#workflow">Workflow</a><a href="#pricing">Pricing</a><a href="#ecosystem">Our products</a><Link href="/login">Sign in</Link><Link className="marketing-nav-cta" href="/signup">Start free trial</Link></div>
    </nav>

    <section className="marketing-hero">
      <div className="marketing-hero-copy">
        <span className="marketing-kicker"><ShieldCheck size={15}/> The breeder management platform</span>
        <h1>Run the breeding program.<br/><em>Connect everything around it.</em></h1>
        <p>MyDogPortal is the operating system at the center of your breeding business. Manage dogs, litters, applications, families, placements, health, finances, communication, automation, and Puppy Portals in one private workspace—then connect DogBreederWeb for your public website and DogBreederDocs for breeder paperwork.</p>
        <div className="marketing-actions"><Link href="/signup">Start your 14-day free trial <ArrowRight size={17}/></Link><a href="#platform">Explore the operating system</a></div>
        <div className="marketing-hero-proof"><span><Check size={13}/>14-day platform trial</span><span><Check size={13}/>Breeding + placement workflows</span><span><Check size={13}/>Private Puppy Portals</span><span><Check size={13}/>Connects with DogBreederWeb + DogBreederDocs</span></div>
      </div>
      <div className="marketing-product-stage" aria-label="Preview of the real MyDogPortal breeder OS and Puppy Portal">
        <div className="marketing-dog-portrait" aria-hidden="true" />
        <div className="marketing-os-preview">
          <header><div><span className="mini-brand-mark"><PawPrint size={10}/></span><b>Willow Creek Chihuahuas</b><small>⌄</small></div><label><span>⌕</span> Search dogs, families, payments…</label><button>+</button><i>◌</i><span className="mini-avatar">SW</span></header>
          <div className="marketing-os-frame">
            <aside><b>Dashboard</b><span>Dogs</span><span>Litters</span><span>Puppies</span><span>Families</span><span>Applications</span><span>Documents</span><span>Payments</span><span>Calendar</span></aside>
            <section><small>KENNEL COMMAND CENTER</small><h2>Good afternoon, Sarah <span>👋</span></h2><p>Here&apos;s what&apos;s happening with your program today.</p>
              <div className="marketing-os-metrics"><span><b>2</b><small>Litters active</small><em>View litters →</em></span><span><b>7</b><small>Puppies</small><em>View puppies →</em></span><span><b>3</b><small>Applications</small><em>Review now →</em></span><span><b>$4,850</b><small>Outstanding</small><em>View payments →</em></span></div>
              <div className="marketing-os-work"><article><header><b>Attention needed</b><i>5</i></header><p>2 applications waiting review <span>›</span></p><p>Puppy vet checks due this week <span>›</span></p><p>1 contract awaiting signature <span>›</span></p><p>2 payments past due <span>›</span></p></article><article><header><b>Breeding calendar</b><em>View calendar</em></header><p><small>MAY 17</small> Ultrasound — Daisy</p><p><small>MAY 20</small> Vet Check — Litter A</p><p><small>MAY 24</small> Go Home — Litter A</p><p><small>MAY 28</small> Progesterone Test — Bella</p></article></div>
              <div className="marketing-os-litter"><b>Litter A · Daisy &amp; Milo</b><em>ACTIVE</em><span>7 puppies · 3 available</span></div>
            </section>
          </div>
        </div>
        <div className="marketing-family-preview"><header><b>Emma&apos;s Portal</b><span>☰</span></header><section><div className="marketing-puppy-photo"/><div><h3>Maple ♡</h3><p>Long Coat Chihuahua · Female</p><small>Born Apr 10, 2025</small><b>Puppy journey <em>6 of 8 milestones</em></b><i><span/></i></div></section><div className="marketing-family-stats"><span><b>6</b><small>Updates</small></span><span><b>1</b><small>Awaiting signature</small></span></div><footer><b>My Puppy</b><span>Health &amp; Growth</span><span>Documents</span><span>Payments</span><span>Messages</span></footer></div>
      </div>
    </section>

    <section className="marketing-trust"><span><Dog size={17}/> Purpose-built breeder operations</span><span><ShieldCheck size={17}/> Private tenant-isolated records</span><span><UsersRound size={17}/> Connected breeder-to-family workflow</span></section>

    <section className="marketing-section" id="platform"><header><span className="marketing-kicker">THE BREEDER OPERATING SYSTEM</span><h2>Run the program. Serve the families. Protect the records.</h2><p>Replace disconnected spreadsheets, inboxes, folders, and payment notes with one operational source of truth.</p></header><div className="marketing-capabilities">{features.map(([Icon,title,text])=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="marketing-feature-detail" id="features">
      <header><span className="marketing-kicker">WHAT MYDOGPORTAL ACTUALLY DOES</span><h2>A breeder operating system—not a collection of unrelated services.</h2><p>MyDogPortal owns the day-to-day breeder workflow. Website creation belongs to DogBreederWeb. Breeder document creation belongs to DogBreederDocs. The integrations connect those products without blurring what each one is for.</p></header>
      <div className="marketing-feature-detail-grid">{featureModules.map(([Icon,kicker,tier,title,text,items])=><article key={title}><header><span><Icon size={21}/></span><div><small>{kicker}</small><em>{tier}</em></div></header><h3>{title}</h3><p>{text}</p><ul>{items.map(item=><li key={item}><Check size={13}/>{item}</li>)}</ul></article>)}</div>
    </section>

    <section className="marketing-workflow" id="workflow">
      <header><span className="marketing-kicker">ONE RECORD. ONE CONTINUOUS WORKFLOW.</span><h2>From first application to go-home—and beyond.</h2><p>MyDogPortal keeps the same family and puppy journey connected, while DogBreederDocs and DogBreederWeb plug into the points where their specialized products belong.</p></header>
      <div className="marketing-workflow-grid">{workflow.map(([Icon,number,title,text])=><article key={number}><div><span>{number}</span><Icon size={19}/></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      <div className="marketing-workflow-result"><ShieldCheck size={19}/><p><b>The result:</b> the breeder sees one operational story around the family, puppy, litter, payment, and paperwork instead of five unrelated systems.</p></div>
    </section>

    <section className="marketing-section marketing-automation" id="automation">
      <header><span className="marketing-kicker">AUTOMATION THAT FOLLOWS THE BREEDER WORKFLOW</span><h2>Do the work once. Let the record carry it forward.</h2><p>The goal is not to replace breeder judgment. It is to stop repetitive administration from consuming the day.</p></header>
      <div className="marketing-automation-grid">{automationCards.map(([Icon,kicker,title,text,result])=><article key={title}><span><Icon size={22}/></span><small>{kicker}</small><h3>{title}</h3><p>{text}</p><footer><Check size={14}/>{result}</footer></article>)}</div>
    </section>

    <section className="marketing-value" id="value">
      <header><span className="marketing-kicker">THE VALUE OF ONE CONNECTED OPERATING RECORD</span><h2>Information entered once should stay useful.</h2><p>MyDogPortal keeps the breeder record operational. Connected products can use that record where appropriate instead of forcing the breeder to start over.</p></header>
      <div className="marketing-value-grid">{valueStack.map(([Icon,title,text])=><article key={title}><span><Icon size={20}/></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      <aside><Globe2 size={20}/><div><b>Use the products you actually need.</b><p>MyDogPortal can run beside an existing website, DogBreederWeb, or another public site. DogBreederDocs can be used independently or connected through Professional and Studio.</p></div></aside>
    </section>

    <section className="marketing-connected" id="ecosystem">
      <div className="marketing-connected-copy"><span className="marketing-kicker">THREE PRODUCTS. THREE CLEAR JOBS. ONE CONNECTED SUITE.</span><h2>A company structure that makes sense before the customer ever signs in.</h2><p>Each product solves a distinct breeder problem. Use them separately, connect the pieces you need, or choose Studio for the complete suite.</p><ul><li><Check size={15}/><b>MyDogPortal</b> — run the breeding program and family workflow</li><li><Check size={15}/><b>DogBreederWeb.Site</b> — build and manage the public breeder website</li><li><Check size={15}/><b>DogBreederDocs.Online</b> — create, edit, send, sign, and retain breeder paperwork</li><li><Check size={15}/>Connected records reduce duplicate entry between products</li></ul></div>
      <div className="marketing-connected-window"><header><span><PawPrint size={16}/></span><div><b>Connected Breeder Suite</b><small>Distinct products · shared workflow</small></div><i>STUDIO</i></header><div className="marketing-connected-hero"><small>ONE BREEDER JOURNEY</small><h3>Public brand.<br/>Private operations.<br/>Professional paperwork.</h3><p>Each product stays focused while the customer experience stays connected.</p></div><div className="marketing-connected-data"><span><b>01</b> DogBreederWeb</span><span><b>02</b> MyDogPortal</span><span><b>03</b> DogBreederDocs</span></div><footer><span>Website</span><ArrowRight size={14}/><span>Operating System</span><ArrowRight size={14}/><span>Documents</span><ArrowRight size={14}/><span>Puppy Portal</span></footer></div>
    </section>

    <section className="marketing-section marketing-pricing" id="pricing"><header><span className="marketing-kicker">{founding.available ? "FOUNDING BREEDER PRICING · FIRST 100 KENNELS" : "MYDOGPORTAL PLANS · MONTHLY OR ANNUAL"}</span><h2>{founding.available ? "Be one of the first 100. Keep the rate you start with." : "Choose the level of operating system your program needs."}</h2><p>{founding.available ? `Founding Breeder pricing is currently available. ${founding.remaining} of ${founding.limit} Founding spots remain. Start with a 14-day free trial, then keep your introductory rate for as long as the subscription remains continuously active.` : "Starter covers the connected operating essentials. Professional adds advanced breeding management, DogBreederDocs, e-signature, whelping, and automation. Studio adds DogBreederWeb, the complete public brand connection, and Business Voice."}</p></header><div className="marketing-plans">{plans.map(([name,price,annual,position,note,items])=><article className={name === "Professional" ? "featured" : ""} key={name}>{name === "Professional" && <em>MOST POPULAR</em>}{founding.available && <strong className="founding-ribbon">FOUNDING BREEDER</strong>}<small className="marketing-plan-position">{position}</small><h3>{name}</h3>{founding.available && <div className="regular-plan-price">Regular {price}/month</div>}<p><b>{founding.available ? foundingPrices[name][0] : price}</b><span>/month{founding.available ? " Founding" : ""}</span></p><div className="marketing-plan-annual"><b>{founding.available ? foundingPrices[name][1] : annual}/year</b><span>{founding.available ? `Regular ${annual}/year` : "Two months free"}</span></div><small>{note}</small><ul>{items.map(item=><li key={item}><Check size={14}/>{item}</li>)}</ul><Link href={"/signup?plan=" + name.toLowerCase()}>Start free trial <ArrowRight size={15}/></Link></article>)}</div><p className="marketing-pricing-note">{founding.available && <><b>Founding Breeder terms:</b> Founding pricing is limited to the first 100 eligible kennel accounts. Your Founding rate remains locked only while that subscription stays continuously active. If you cancel or allow the subscription to lapse, Founding pricing is forfeited and any future subscription will be at the then-current published rate.<br/><br/></>}<b>Easy cancellation, without the runaround.</b> Monthly and annual subscriptions use connected PayPal checkout. Your 14-day $0 platform trial is built into the billing plan, and you can cancel your MyDogPortal subscription from your own account without opening a support ticket.</p></section>

    <section className="marketing-section marketing-services" id="products"><header><span className="marketing-kicker">THE CONNECTED BREEDER PRODUCT FAMILY</span><h2>Start with the problem you need to solve.</h2><p>These are not three copies of the same service. Each product has a clear role and can stand on its own.</p></header><div className="marketing-service-grid">
      <article><header><span><PawPrint size={21}/></span><div><h3>MyDogPortal</h3><strong>Breeder Operating System</strong></div></header><p>Run dogs, breedings, litters, puppies, applications, families, placements, health, finances, communication, automation, and private Puppy Portals.</p><ul><li><Check size={13}/>This is the platform you are viewing now</li><li><Check size={13}/>Starter, Professional, and Studio plans</li><li><Check size={13}/>Connects to DogBreederWeb and DogBreederDocs</li></ul><a href="#platform">Explore MyDogPortal <ArrowRight size={15}/></a></article>
      <article><header><span><Globe2 size={21}/></span><div><h3>DogBreederWeb.Site</h3><strong>Breeder Website Platform</strong></div></header><p>Build and manage the breeder&apos;s public presence: website, domain, hosting, SSL, branded email, publishing, forms, and website design tools.</p><ul><li><Check size={13}/>Available as a standalone website product</li><li><Check size={13}/>Included with MyDogPortal Studio</li><li><Check size={13}/>Designed to connect public breeder data to MyDogPortal</li></ul><a href="https://dogbreederweb.site" target="_blank" rel="noreferrer">Visit DogBreederWeb.Site <ExternalLink size={15}/></a></article>
      <article><header><span><FileSignature size={21}/></span><div><h3>DogBreederDocs.Online</h3><strong>Breeder Document Platform</strong></div></header><p>Create, edit, save, send, sign, and retain professional breeder paperwork without turning the breeder operating system into a document storefront.</p><ul><li><Check size={13}/>Available as a standalone document product</li><li><Check size={13}/>Included with Professional and Studio</li><li><Check size={13}/>Connected workflows can use MyDogPortal family and puppy data</li></ul><a href="https://dogbreederdocs.online" target="_blank" rel="noreferrer">Visit DogBreederDocs.Online <ExternalLink size={15}/></a></article>
    </div><aside><ShieldCheck size={18}/><p><b>Studio is the suite—not a pile of à-la-carte services.</b> Studio combines MyDogPortal Professional, DogBreederWeb, DogBreederDocs, Business Voice, and the connected breeder-to-family workflow in one subscription while keeping every product&apos;s role clear.</p></aside></section>

    <section className="marketing-section marketing-examples" id="examples">
      <header><span className="marketing-kicker">FIVE BREEDER OS DEMONSTRATIONS</span><h2>See how MyDogPortal adapts to different breeding programs.</h2><p>These read-only demonstrations focus on the operating system: dogs, litters, families, breeding milestones, documents, payments, automations, and Puppy Portal activity. Website templates and website purchasing belong on DogBreederWeb.Site.</p></header>
      <div className="marketing-example-grid">
        <article><span><Dog size={23}/></span><small>OS DEMO 01 · CHIHUAHUA</small><h3>Willow Creek Chihuahuas</h3><p>See a small companion-breed program managing dogs, litters, applications, puppy placements, family records, payments, and Puppy Portal activity.</p><div className="marketing-example-actions"><Link href="/templates/os-demo/willow-creek">Explore OS demo <ArrowRight size={15}/></Link></div></article>
        <article><span><Dog size={23}/></span><small>OS DEMO 02 · GOLDEN RETRIEVER</small><h3>{"Cedar & Creek Goldens"}</h3><p>See a larger family-focused program with breeding milestones, waitlist activity, health testing, puppy matching, documents, and family communication.</p><div className="marketing-example-actions"><Link href="/templates/os-demo/cedar-creek">Explore OS demo <ArrowRight size={15}/></Link></div></article>
        <article><span><Dog size={23}/></span><small>OS DEMO 03 · STANDARD POODLE</small><h3>Northstar Standard Poodles</h3><p>Explore pedigree context, breeding planning, health records, applications, family placement, and operational reporting inside the breeder workspace.</p><div className="marketing-example-actions"><Link href="/templates/os-demo/northstar-poodles">Explore OS demo <ArrowRight size={15}/></Link></div></article>
        <article><span><Dog size={23}/></span><small>OS DEMO 04 · AUSTRALIAN SHEPHERD</small><h3>Bluebird Aussies</h3><p>Follow an active program using puppy growth tracking, family updates, waitlists, health milestones, placement readiness, and Puppy Portals.</p><div className="marketing-example-actions"><Link href="/templates/os-demo/bluebird-aussies">Explore OS demo <ArrowRight size={15}/></Link></div></article>
        <article><span><ShieldCheck size={23}/></span><small>OS DEMO 05 · GERMAN SHEPHERD</small><h3>Ironwood German Shepherds</h3><p>See a working and sport-oriented program use structured breeding records, health information, pedigrees, applications, finances, and family workflow.</p><div className="marketing-example-actions"><Link href="/templates/os-demo/ironwood-shepherds">Explore OS demo <ArrowRight size={15}/></Link></div></article>
      </div>
    </section>

    <section className="marketing-section marketing-faq" id="faq"><header><span className="marketing-kicker">QUESTIONS BEFORE YOU START</span><h2>Choose one product—or connect the suite.</h2><p>MyDogPortal is the operating system. DogBreederWeb is the website product. DogBreederDocs is the document product. The customer should never have to guess which one does what.</p></header><div>{faqs.map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

    <section className="marketing-final"><span><PawPrint size={25}/></span><div><small>MYDOGPORTAL</small><h2>Put the breeding program at the center of one connected workflow.</h2></div><Link href="/signup">Create your kennel workspace <ArrowRight size={17}/></Link></section>

    <footer className="marketing-footer"><Link className="marketing-brand" href="/"><span className="marketing-brand-mark"><PawPrint size={20}/></span><b>MyDogPortal</b></Link><p>The breeder operating system in a connected product family.</p><div><a href="https://dogbreederweb.site" target="_blank" rel="noreferrer">DogBreederWeb</a><a href="https://dogbreederdocs.online" target="_blank" rel="noreferrer">DogBreederDocs</a><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></div></footer>
  </main>;
}
