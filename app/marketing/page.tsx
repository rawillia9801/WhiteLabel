import Link from "next/link";
import { ArrowRight, Check, Dog, ExternalLink, FileSignature, Globe2, HeartPulse, MessageSquareText, MonitorSmartphone, PawPrint, PhoneCall, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
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
  [PhoneCall, "Business Voice", "$69 setup", "A professionally configured local business line with your greeting and breeder information.", ["Local number: $8.99/month or $99/year", "Incoming calls: $0.03/minute", "Outgoing calls: $0.04/minute", "IVR/menu, business hours, voicemail, and routing", "Live examples: Willow Creek (276) 250-9512 · Cedar & Creek (276) 276-2757"]],
  [MessageSquareText, "Business SMS", "$59 activation", "Optional registered business messaging, separate from Business Voice and the software subscription.", ["$14.99/month per active registered campaign", "$25 activation per additional campaign", "Incoming: $0.02 per SMS segment", "Outgoing: $0.03 per SMS segment", "Approval required; allow up to 30 days"]],
] as const;

const workflow = [
  [UsersRound, "01", "Application arrives", "Keep the family, application answers, contact information, and review status together from the beginning."],
  [Dog, "02", "Review & match", "Move an approved family into matching and connect the right puppy without rebuilding the record somewhere else."],
  [FileSignature, "03", "Generate documents", "Use information already in the system to prepare agreements, retain signatures, and keep the signed copy with the family."],
  [WalletCards, "04", "Track the money", "Record deposits, balances, payment plans, due dates, expenses, and the financial history behind each placement."],
  [Globe2, "05", "Coordinate go-home", "Keep pickup, delivery, required forms, payment readiness, and final handoff details visible before release."],
  [HeartPulse, "06", "Continue in Puppy Portal", "Give the family one branded place for updates, documents, health records, messages, milestones, and next steps."],
] as const;

const automationCards = [
  [MessageSquareText, "AUTOMATED COMMUNICATION", "Send the right update at the right moment", "Application acknowledgements, approval notices, payment reminders, puppy milestones, and family updates can follow the workflow instead of living on a handwritten follow-up list.", "Fewer forgotten follow-ups"],
  [FileSignature, "DOCUMENT AUTOMATION", "Stop retyping the same buyer and puppy information", "Prepare breeder documents from information already entered into the system, including placement paperwork, payment-plan documents, and signed family copies.", "Connected to the family record"],
  [UsersRound, "FAMILY EXPERIENCE", "A Puppy Portal that stays useful after the deposit", "Families can return to one private, branded experience for documents, puppy updates, requests, payment information, health and growth records, and go-home preparation.", "Private family access"],
  [MonitorSmartphone, "PUBLIC WEBSITE", "Let your website and operating system work together", "Studio connects a customizable breeder website to the same program you maintain inside MyDogPortal, so public information does not need to become a second business to manage.", "Your brand, not ours"],
] as const;

const faqs = [
  ["Do I have to replace my current website?", "No. You can use MyDogPortal as your breeder operating system and keep your current public website, choose a Studio template, or request a custom breeder website."],
  ["Can families see my private breeder records?", "No. Breeder operations stay private. Puppy Portals are family-facing experiences that expose only the information and documents intended for that family."],
  ["Are the phone systems all the same?", "No. Business Voice can have its own greeting, voice, menu choices, voicemail, business hours, and routing. The two live example numbers intentionally use different menus."],
  ["Does MyDogPortal process puppy purchases?", "No. MyDogPortal organizes breeder business records and family workflows. Your puppy sales and payment arrangements remain between your breeding program and your families."],
  ["Can I start before deciding on a website or phone system?", "Yes. Optional websites, domains, Business Voice, and messaging are separate services. Start the platform first and add the infrastructure you want later."],
] as const;

export default function MarketingPage() {
  return <main className="marketing-page">
    <nav className="marketing-nav" aria-label="Main navigation">
      <Link className="marketing-brand" href="/"><span><PawPrint size={21}/></span><b>MyDogPortal</b></Link>
      <div><a href="#platform">Platform</a><a href="#workflow">Workflow</a><a href="#automation">Automation</a><a href="#pricing">Pricing</a><a href="#examples">Examples</a><Link href="/login">Sign in</Link><Link className="marketing-nav-cta" href="/signup">Start free trial</Link></div>
    </nav>
    <section className="marketing-hero">
      <div className="marketing-hero-copy">
        <span className="marketing-kicker"><ShieldCheck size={15}/> Built for professional dog breeders</span>
        <h1>Your breeding program.<br/><em>One connected system.</em></h1>
        <p>Run breeding, families, health, finances, documents, communications, and buyer portals from one professional system built around your kennel—not around generic small-business software.</p>
        <div className="marketing-actions"><Link href="/signup">Start your 14-day free trial <ArrowRight size={17}/></Link><a href="#platform">Explore the platform</a></div>
        <div className="marketing-hero-proof"><span><Check size={13}/>14-day platform trial</span><span><Check size={13}/>Private breeder workspace</span><span><Check size={13}/>Branded family experience</span></div>
      </div>
      <div className="marketing-product">
        <header><span><PawPrint size={17}/></span><div><b>Willow Creek</b><small>Breeder workspace</small></div><i>LIVE</i></header>
        <section><small>TODAY&apos;S COMMAND CENTER</small><h2>Everything that needs your attention.</h2><div className="marketing-metrics"><span><b>3</b>Active litters</span><span><b>12</b>Puppies</span><span><b>5</b>Applications</span></div></section>
        <div className="marketing-product-list"><p><span>Breeding calendar</span><b>Two milestones this week</b></p><p><span>Family journey</span><b>Hazel is ready for matching</b></p><p><span>Payments</span><b>Three balances due</b></p></div>
      </div>
    </section>
    <section className="marketing-trust"><span><Globe2 size={17}/> Your kennel. Your colors. Your domain.</span><span><ShieldCheck size={17}/> Private tenant-isolated records</span><span><UsersRound size={17}/> Branded family experience</span></section>
    <section className="marketing-section" id="platform"><header><span className="marketing-kicker">THE COMPLETE BREEDER OPERATING SYSTEM</span><h2>Run the program. Serve the families. Protect the records.</h2><p>Replace disconnected spreadsheets, inboxes, folders, and payment notes with one operational source of truth.</p></header><div className="marketing-capabilities">{features.map(([Icon,title,text])=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="marketing-workflow" id="workflow">
      <header><span className="marketing-kicker">ONE RECORD. ONE CONTINUOUS WORKFLOW.</span><h2>From first application to go-home—and beyond.</h2><p>MyDogPortal keeps the same family and puppy journey connected instead of forcing you to rebuild it across forms, spreadsheets, email threads, documents, and payment notes.</p></header>
      <div className="marketing-workflow-grid">{workflow.map(([Icon,number,title,text])=><article key={number}><div><span>{number}</span><Icon size={19}/></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      <div className="marketing-workflow-result"><ShieldCheck size={19}/><p><b>The result:</b> when you open a family, puppy, litter, payment, or document, you can see the work around it—not just an isolated row of data.</p></div>
    </section>
    <section className="marketing-section marketing-automation" id="automation">
      <header><span className="marketing-kicker">AUTOMATION THAT FOLLOWS THE BREEDER WORKFLOW</span><h2>Do the work once. Let the record carry it forward.</h2><p>Automation should remove repetitive breeder administration without making the family experience feel robotic.</p></header>
      <div className="marketing-automation-grid">{automationCards.map(([Icon,kicker,title,text,result])=><article key={title}><span><Icon size={22}/></span><small>{kicker}</small><h3>{title}</h3><p>{text}</p><footer><Check size={14}/>{result}</footer></article>)}</div>
    </section>
    <section className="marketing-connected">
      <div className="marketing-connected-copy"><span className="marketing-kicker">YOUR PUBLIC BRAND + YOUR PRIVATE OPERATIONS</span><h2>A breeder website that does more than look good.</h2><p>Studio can connect your public breeder presence to the program you already maintain. Publish the customer-facing pieces families need while your operational records stay inside the breeder workspace.</p><ul><li><Check size={15}/>Available puppies and planned litters</li><li><Check size={15}/>Dams, sires, health testing, policies, and applications</li><li><Check size={15}/>Your domain, photography, colors, and kennel identity</li><li><Check size={15}/>A clear path from your website into the private Puppy Portal</li></ul><a href="#examples">Compare live website templates <ArrowRight size={15}/></a></div>
      <div className="marketing-connected-window"><header><span><PawPrint size={16}/></span><div><b>YourKennel.com</b><small>Connected breeder website</small></div><i>STUDIO</i></header><div className="marketing-connected-hero"><small>PLANNED LITTER · FALL 2026</small><h3>Raised with purpose.<br/>Matched with care.</h3><p>Public content stays on-brand while the operational record stays protected.</p></div><div className="marketing-connected-data"><span><b>4</b> parent dogs</span><span><b>2</b> planned litters</span><span><b>1</b> connected application</span></div><footer><span>Website</span><ArrowRight size={14}/><span>Application</span><ArrowRight size={14}/><span>Puppy Portal</span></footer></div>
    </section>
    <section className="marketing-section marketing-pricing" id="pricing"><header><span className="marketing-kicker">SIMPLE MONTHLY PRICING</span><h2>Choose the workspace that fits your program.</h2><p>Every plan starts with a 14-day platform trial. Optional domains, websites, voice, and messaging remain separate.</p></header><div className="marketing-plans">{plans.map(([name,price,note,items])=><article className={name === "Professional" ? "featured" : ""} key={name}>{name === "Professional" && <em>MOST POPULAR</em>}<h3>{name}</h3><p><b>{price}</b><span>/month</span></p><small>{note}</small><ul>{items.map(item=><li key={item}><Check size={14}/>{item}</li>)}</ul><Link href="/signup">Start free trial <ArrowRight size={15}/></Link></article>)}</div></section>
    <section className="marketing-section marketing-services" id="services"><header><span className="marketing-kicker">OPTIONAL LAUNCH & COMMUNICATION SERVICES</span><h2>Add the business infrastructure your kennel needs.</h2><p>These services are separate from your MyDogPortal subscription. Request them during signup—no add-on payment is taken until the service is confirmed.</p></header><div className="marketing-service-grid">{services.map(([Icon,name,price,text,items])=><article key={name}><header><span><Icon size={21}/></span><div><h3>{name}</h3><strong>{price}</strong></div></header><p>{text}</p><ul>{items.map(item=><li key={item}><Check size={13}/>{item}</li>)}</ul><Link href="/signup">Add to my setup <ArrowRight size={15}/></Link></article>)}</div><aside><ShieldCheck size={18}/><p><b>Clear, separate billing.</b> Voice and SMS usage charges are billed separately from your software plan. SMS registration and carrier approval are required and activation is not guaranteed.</p></aside></section>
    <section className="marketing-section marketing-examples" id="examples">
      <header><span className="marketing-kicker">WEBSITE TEMPLATE GALLERY</span><h2>Choose a website style that feels like your kennel.</h2><p>Start with a professionally designed breeder website and make it yours. Your breed, dogs, litters, colors, photography, policies, applications, and Puppy Portal replace the demonstration content.</p></header>
      <div className="marketing-example-grid">
        <article>
          <span><MonitorSmartphone size={23}/></span>
          <small>WEBSITE TEMPLATE 01 · CHIHUAHUA</small>
          <h3>Willow Creek Chihuahuas</h3>
          <p>See a breeder-facing website example with its own brand and public customer experience. Business Voice: <b>(276) 250-9512</b>.</p>
          <div className="marketing-example-actions"><a href="https://willowcreekchihuahuas.com" target="_blank" rel="noreferrer">Visit website <ExternalLink size={15}/></a><a href="tel:+12762509512">Call (276) 250-9512 <PhoneCall size={15}/></a></div>
        </article>
        <article>
          <span><Dog size={23}/></span>
          <small>WEBSITE TEMPLATE 02 · GOLDEN RETRIEVER</small>
          <h3>Cedar & Creek Goldens</h3>
          <p>A completely different warm, editorial breeder website built around outdoor photography, family connection, health testing, and Golden Retriever storytelling. Business Voice: <b>(276) 276-2757</b>.</p>
          <div className="marketing-example-actions"><Link href="/templates/cedar-creek">View template <ArrowRight size={15}/></Link><a href="tel:+12762762757">Call (276) 276-2757 <PhoneCall size={15}/></a></div>
        </article>
      </div>
    </section>
    <section className="marketing-section marketing-faq" id="faq"><header><span className="marketing-kicker">QUESTIONS BEFORE YOU START</span><h2>Built to fit around a real breeding program.</h2><p>Start with the operating system, then add the public-facing pieces and communication tools that make sense for your kennel.</p></header><div>{faqs.map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
    <section className="marketing-final"><span><PawPrint size={25}/></span><div><small>MYDOGPORTAL</small><h2>Give your breeding program the operating system it deserves.</h2></div><Link href="/signup">Create your kennel workspace <ArrowRight size={17}/></Link></section>
    <footer className="marketing-footer"><Link className="marketing-brand" href="/"><span><PawPrint size={18}/></span><b>MyDogPortal</b></Link><p>White-label breeder operations and family portals.</p><div><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link></div></footer>
  </main>;
}
