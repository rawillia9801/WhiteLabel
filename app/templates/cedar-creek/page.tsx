import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Dna,
  Dog,
  FileHeart,
  Heart,
  HeartHandshake,
  Mail,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trees,
} from "lucide-react";
import "./template.css";

export const metadata: Metadata = {
  title: "Cedar & Creek Goldens | MyDogPortal Website Template",
  description: "A warm editorial Golden Retriever breeder website template available through MyDogPortal.",
};

const dogs = [
  { name: "Wren", role: "Our Girls", detail: "English Cream · OFA CHIC", photo: "wren" },
  { name: "August", role: "Our Boys", detail: "Golden · OFA CHIC", photo: "august" },
  { name: "Meadow", role: "Our Girls", detail: "Light Golden · OFA CHIC", photo: "meadow" },
] as const;

const process = [
  ["01", "Tell us about your family", "Start with our thoughtful application so we can learn about your home, lifestyle, and hopes for your future Golden."],
  ["02", "Join the family list", "Approved families receive litter planning updates, expected timing, and transparent guidance before a puppy is ever selected."],
  ["03", "Meet your match", "Temperament, family goals, and puppy development guide placement. We help each family choose with confidence."],
  ["04", "Grow together", "Your private Puppy Portal keeps photos, weights, records, documents, payments, and go-home information together."],
] as const;

export default function CedarCreekTemplatePage() {
  return <main className="cc-site">
    <div className="cc-demo-bar"><span>MYDOGPORTAL WEBSITE TEMPLATE 02 · INCLUDED KENNEL ADDRESS</span><p><b>cedar-creek.mydogportal.site</b> is the example address for this template. Your included address follows the same <b>yourkennel.mydogportal.site</b> format. Your kennel name, dogs, photos, colors, policies, and content replace the sample information.</p><div className="template-demo-actions"><Link href="/templates/os-demo/cedar-creek">Explore OS demo <ArrowRight size={14}/></Link><Link href="/signup?website_template=cedar-creek">Choose this style <ArrowRight size={14}/></Link></div></div>

    <nav className="cc-nav" aria-label="Cedar & Creek navigation">
      <a className="cc-brand" href="#home" aria-label="Cedar and Creek Goldens home"><span><Trees size={25}/></span><div><b>Cedar & Creek</b><small>GOLDEN RETRIEVERS</small></div></a>
      <div className="cc-nav-links"><a href="#story">Our Story</a><a href="#goldens">Our Goldens</a><a href="#puppies">Puppies</a><a href="#health">Health</a><a href="#process">Our Process</a></div>
      <div className="cc-nav-actions"><Link href="/portal/login">Puppy Portal</Link><a className="cc-nav-apply" href="#apply">Apply for a puppy</a></div>
      <a className="cc-menu" href="#apply" aria-label="Apply for a puppy"><PawPrint size={20}/></a>
    </nav>

    <section className="cc-hero" id="home">
      <div className="cc-hero-copy">
        <span className="cc-eyebrow"><PawPrint size={14}/> FAMILY RAISED · HEALTH TESTED · PURPOSEFULLY MATCHED</span>
        <h1>Golden hearts,<br/><em>raised for home.</em></h1>
        <p>Thoughtfully bred Golden Retrievers raised with intention, known deeply, and matched carefully with families ready for a lifetime of adventure.</p>
        <div className="cc-hero-actions"><a href="#puppies">Meet our puppies <ArrowRight size={16}/></a><a href="#story">Our breeding philosophy</a></div>
        <div className="cc-hero-notes"><span><ShieldCheck size={16}/><b>OFA health tested</b></span><span><HeartHandshake size={16}/><b>Family raised</b></span><span><Sparkles size={16}/><b>Lifetime support</b></span></div>
      </div>
      <div className="cc-hero-photo" role="img" aria-label="Golden Retriever outdoors"><div className="cc-photo-note"><small>MEET WREN</small><b>The kind of Golden we build our program around.</b><a href="#goldens">Meet our dogs <ChevronRight size={14}/></a></div></div>
    </section>

    <section className="cc-intro" id="story">
      <div className="cc-intro-mark"><span>EST.</span><b>2018</b><i/></div>
      <div className="cc-intro-copy"><span className="cc-kicker">OUR PHILOSOPHY</span><h2>We&apos;re not simply raising puppies.<br/>We&apos;re shaping family dogs.</h2><p>Every decision begins with the dog we want beside us: healthy, steady, joyful, confident, and deeply connected to people. Our Goldens live with us, our puppies grow up in the rhythm of family life, and every placement is approached as the beginning of a long relationship.</p><a href="#health">How we raise them <ArrowRight size={15}/></a></div>
      <aside><blockquote>“The best breeding program is one where health, temperament, and the human-dog bond are never competing priorities.”</blockquote><span>OUR STANDARD</span></aside>
    </section>

    <section className="cc-goldens" id="goldens">
      <header className="cc-section-head"><div><span className="cc-kicker">THE HEART OF OUR PROGRAM</span><h2>Meet our Goldens.</h2></div><p>Dogs chosen for stable temperaments, sound structure, proven health, and the unmistakable Golden Retriever character we love.</p></header>
      <div className="cc-dog-grid">{dogs.map((dog) => <article key={dog.name}><div className={`cc-dog-photo ${dog.photo}`} role="img" aria-label={`${dog.name}, Golden Retriever`}/><div><small>{dog.role}</small><h3>{dog.name}</h3><p>{dog.detail}</p><a href="#health">Profile & health testing <ArrowRight size={14}/></a></div></article>)}</div>
    </section>

    <section className="cc-puppies" id="puppies">
      <div className="cc-puppy-photo" role="img" aria-label="Golden Retriever puppy"/>
      <div className="cc-puppy-copy"><span className="cc-kicker">PLANNED WITH PURPOSE</span><h2>Our next chapter may be yours.</h2><p>We plan only a limited number of litters each year. Approved families are kept informed from planned pairing through go-home, with thoughtful matching and a private Puppy Portal for every placed puppy.</p><div className="cc-litter-card"><span><Heart size={18}/></span><div><small>PLANNED LITTER</small><b>Wren × August</b><p>Expected winter · Family list now forming</p></div><i>OPEN</i></div><div className="cc-puppy-actions"><a href="#apply">Apply for a puppy <ArrowRight size={15}/></a><a href="#process">How our process works</a></div></div>
    </section>

    <section className="cc-health" id="health">
      <header><span className="cc-kicker">HEALTH IS THE FOUNDATION</span><h2>More than a promise.<br/>A documented standard.</h2><p>Health testing is part of how we make breeding decisions—not a marketing badge added afterward.</p></header>
      <div className="cc-health-grid">
        <article><span><Award size={22}/></span><b>OFA clearances</b><p>Hips, elbows, cardiac, and annual eye examinations completed as appropriate before breeding.</p></article>
        <article><span><Dna size={22}/></span><b>Genetic screening</b><p>Breed-relevant DNA testing helps us make informed pairings and reduce avoidable inherited risk.</p></article>
        <article><span><Stethoscope size={22}/></span><b>Veterinary care</b><p>Puppies receive age-appropriate veterinary care, wellness checks, deworming, and health documentation.</p></article>
        <article><span><FileHeart size={22}/></span><b>Records that follow them</b><p>Families receive organized health information and ongoing access to puppy records through their portal.</p></article>
      </div>
      <div className="cc-health-proof"><ShieldCheck size={28}/><div><small>TRANSPARENCY MATTERS</small><b>Health records should be easy to verify.</b><p>This template can publish breeder-maintained health testing, registrations, pedigrees, and supporting records directly from MyDogPortal.</p></div><a href="#goldens">View our dogs <ArrowRight size={15}/></a></div>
    </section>

    <section className="cc-process" id="process">
      <header className="cc-section-head"><div><span className="cc-kicker">FROM HELLO TO HOME</span><h2>A thoughtful path to your puppy.</h2></div><p>No confusing handoffs. Your application, puppy match, updates, documents, payments, and go-home details stay connected.</p></header>
      <div className="cc-process-grid">{process.map(([number,title,text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="cc-portal-story">
      <div><span className="cc-kicker">YOUR PRIVATE PUPPY PORTAL</span><h2>The waiting should feel connected, too.</h2><p>Once your puppy journey begins, your family receives a private place for weekly updates, photos, growth records, documents, payments, messages, pickup or delivery details, and go-home resources.</p><ul><li><Check size={14}/> Puppy photos and weekly updates</li><li><Check size={14}/> Health and growth records</li><li><Check size={14}/> Agreements and e-signatures</li><li><Check size={14}/> Payment history and balance</li></ul><Link href="/portal/login">Family portal sign in <ArrowRight size={15}/></Link></div>
      <div className="cc-portal-card"><header><span><PawPrint size={18}/></span><div><b>Scout&apos;s Puppy Portal</b><small>CEDAR & CREEK GOLDENS</small></div><i>PRIVATE</i></header><section><small>LATEST UPDATE</small><h3>Five weeks & finding his confidence</h3><p>Scout is exploring new surfaces, settling beautifully after play, and becoming very interested in following us everywhere.</p><div><span><small>WEIGHT</small><b>7.8 lb</b></span><span><small>NEXT</small><b>Vet exam</b></span></div></section><footer><span><Check size={14}/> 6 journey steps complete</span><b>75%</b></footer></div>
    </section>

    <section className="cc-testimonial"><Sparkles size={25}/><blockquote>“From the first application to the day we brought Maisie home, we always knew what was happening. The updates made us feel like we already knew her before we met her.”</blockquote><div><b>THE CARTER FAMILY</b><span>Maisie · Wren&apos;s 2025 litter</span></div></section>

    <section className="cc-apply" id="apply">
      <div><span className="cc-kicker">BEGIN YOUR STORY</span><h2>Ready to meet your future Golden?</h2><p>Tell us about your family, your home, and the life you imagine sharing with your dog. We&apos;ll take it from there.</p><a href="#application">Start puppy application <ArrowRight size={16}/></a></div>
      <aside id="application"><span><PawPrint size={24}/></span><b>Cedar & Creek Goldens</b><p>Sample breeder identity for MyDogPortal Website Template 02</p><ul><li><MapPin size={14}/> Blue Ridge Mountains · Virginia</li><li><Mail size={14}/> hello@cedarandcreek.example</li><li><Dog size={14}/> Golden Retrievers</li></ul></aside>
    </section>

    <footer className="cc-footer"><a className="cc-brand" href="#home"><span><Trees size={23}/></span><div><b>Cedar & Creek</b><small>GOLDEN RETRIEVERS</small></div></a><p>Purposefully bred. Thoughtfully raised. Loved for life.</p><div><a href="#goldens">Our Goldens</a><a href="#health">Health</a><a href="#apply">Apply</a><Link href="/portal/login">Puppy Portal</Link></div><small>Demo content for MyDogPortal Website Template 02 · Powered by MyDogPortal</small></footer>
  </main>;
}
