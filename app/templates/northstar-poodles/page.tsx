import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Dna, FileHeart, HeartHandshake, PawPrint, ShieldCheck, Sparkles } from "lucide-react";
import "../collection.css";

export const metadata: Metadata = {
  title: "Northstar Standard Poodles | MyDogPortal Website Template",
  description: "A luxury editorial Standard Poodle breeder website template available through MyDogPortal.",
};

export default function NorthstarPoodlesTemplatePage() {
  return <main className="ns-site">
    <div className="template-demo"><span>MYDOGPORTAL WEBSITE TEMPLATE 03</span><p>Demonstration content only. Your kennel, dogs, photography, colors, policies, and content replace everything shown.</p><Link href="/signup?website_template=northstar-poodles">Choose this style <ArrowRight size={13}/></Link></div>
    <nav className="ns-nav">
      <a className="ns-brand" href="#home"><b>Northstar</b><small>STANDARD POODLES</small></a>
      <div className="ns-links"><a href="#philosophy">Philosophy</a><a href="#dogs">Our Poodles</a><a href="#health">Health</a><a href="#portal">Puppy Portal</a></div>
      <div><Link href="/portal/login">Family sign in</Link><a className="ns-apply" href="#apply">Apply</a></div>
    </nav>
    <section className="ns-hero" id="home">
      <div className="ns-hero-copy"><span className="ns-kicker">INTELLIGENCE · STRUCTURE · TEMPERAMENT</span><h1>Elegance<br/>with <em>purpose.</em></h1><p>Standard Poodles bred for sound health, stable minds, beautiful structure, and the kind of presence that becomes part of the family.</p><div className="ns-actions"><a href="#dogs">Meet our poodles <ArrowRight size={14}/></a><a href="#philosophy">Our standard</a></div></div>
      <div className="ns-hero-photo" role="img" aria-label="Standard Poodle portrait"><aside><small>THE NORTHSTAR STANDARD</small><b>Beautiful dogs should be every bit as sound as they are striking.</b></aside></div>
    </section>
    <section className="ns-statement" id="philosophy"><div><span className="ns-kicker">OUR BREEDING PHILOSOPHY</span><h2>Intentional from pedigree to placement.</h2><p>Every pairing begins with health, genetic diversity, temperament, structure, and the future family in mind. Our puppies grow inside our home, experience thoughtful early development, and leave with a family connection that continues through their private Puppy Portal.</p></div><aside>“A polished breeder experience should begin long before go-home—and continue long after.”</aside></section>
    <section className="ns-dogs" id="dogs"><header className="ns-section-head"><div><span className="ns-kicker">OUR POODLES</span><h2>The dogs behind the program.</h2></div><p>Detailed parent profiles can connect health testing, pedigree information, registrations, genetic results, and planned litters directly from MyDogPortal.</p></header><div className="ns-dog-grid"><article><div className="ns-dog-photo"/><div><small>FOUNDATION DAM</small><h3>Odette</h3><p>Black · Standard Poodle · Sample health-tested parent profile</p></div></article><article><div className="ns-dog-photo"/><div><small>FOUNDATION SIRE</small><h3>Atlas</h3><p>Silver beige · Standard Poodle · Sample health-tested parent profile</p></div></article></div></section>
    <section className="ns-health" id="health"><div><span className="ns-kicker">DOCUMENTED HEALTH</span><h2>Clarity serious families can verify.</h2><p>Use the public site to present the health information families should see while breeder-only records remain private inside your operating system.</p></div><div className="ns-proof"><article><span><Dna size={21}/></span><b>Genetic screening</b><p>Publish breed-relevant testing and clear result summaries.</p></article><article><span><ShieldCheck size={21}/></span><b>OFA records</b><p>Organize and present parent health clearances.</p></article><article><span><FileHeart size={21}/></span><b>Pedigree context</b><p>Connect lineage and breeding-record information.</p></article><article><span><HeartHandshake size={21}/></span><b>Lifetime support</b><p>Keep families connected after their puppy goes home.</p></article></div></section>
    <section className="ns-portal" id="portal"><div><span className="ns-kicker">PRIVATE FAMILY EXPERIENCE</span><h2>Your brand continues inside the Puppy Portal.</h2><p>Families receive one secure place for their puppy, health and growth records, updates, documents, payments, schedule, messages, transportation details, and resources.</p><ul><li><Check size={14}/> Puppy and growth records</li><li><Check size={14}/> Updates and milestones</li><li><Check size={14}/> Agreements and documents</li><li><Check size={14}/> Payments and go-home details</li></ul></div><div className="ns-portal-card"><small>NORTHSTAR · PRIVATE PUPPY PORTAL</small><h3>Welcome, Amelia</h3><div><span><small>ASSIGNED</small><b>1 puppy</b></span><span><small>UPDATES</small><b>6 posted</b></span><span><small>JOURNEY</small><b>80%</b></span></div></div></section>
    <section className="ns-apply-section" id="apply"><div><span className="ns-kicker">BEGIN YOUR PUPPY JOURNEY</span><h2>Tell us about your family.</h2></div><Link href="/signup?website_template=northstar-poodles">Choose Northstar style <ArrowRight size={15}/></Link></section>
    <footer className="ns-footer"><b>Northstar Standard Poodles</b><span>Sample breeder identity · MyDogPortal Website Template 03</span><span>Powered by MyDogPortal</span></footer>
  </main>;
}
