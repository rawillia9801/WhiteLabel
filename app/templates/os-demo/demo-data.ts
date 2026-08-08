export type DemoKennel = {
  slug: string;
  name: string;
  breed: string;
  monogram: string;
  websiteLabel: string;
  websiteHref: string;
  domainType: string;
  accent: string;
  accentDark: string;
  greeting: string;
  dogs: Array<{ name: string; role: string; detail: string; status: string }>;
  litter: { name: string; parents: string; born: string; puppies: number; reserved: number; next: string };
  breeding: { dam: string; sire: string; stage: string; due: string; progesterone: string; coi: string };
  families: Array<{ name: string; puppy: string; stage: string; balance: string }>;
  activity: Array<{ title: string; detail: string; time: string }>;
};

export const demoKennels: Record<string, DemoKennel> = {
  "willow-creek": {
    slug: "willow-creek",
    name: "Willow Creek Chihuahuas",
    breed: "Chihuahua",
    monogram: "WC",
    websiteLabel: "willowcreekchihuahuas.com",
    websiteHref: "https://willowcreekchihuahuas.com",
    domainType: "CUSTOM .COM",
    accent: "#14958f",
    accentDark: "#123f3d",
    greeting: "Good morning, Willow Creek",
    dogs: [
      { name: "Poppy", role: "Dam", detail: "Long coat · Chocolate & tan", status: "Nursing" },
      { name: "Milo", role: "Sire", detail: "Smooth coat · Cream", status: "Active" },
      { name: "Hazel", role: "Dam", detail: "Long coat · Black & tan", status: "Heat expected" },
      { name: "Theo", role: "Sire", detail: "Long coat · Sable", status: "Active" },
    ],
    litter: { name: "Poppy × Milo", parents: "Poppy + Milo", born: "Jul 22, 2026", puppies: 4, reserved: 3, next: "6-week vaccines · Sep 2" },
    breeding: { dam: "Hazel", sire: "Theo", stage: "Planning", due: "Estimated Oct 18", progesterone: "Next test Aug 12", coi: "4.8% projected COI" },
    families: [
      { name: "Emma Harris", puppy: "Clover", stage: "Go-home prep", balance: "$1,200" },
      { name: "Megan Cole", puppy: "Biscuit", stage: "Documents", balance: "$650" },
      { name: "Ryan Miller", puppy: "Maple", stage: "Weekly updates", balance: "Paid" },
    ],
    activity: [
      { title: "Puppy update published", detail: "Week 2 update sent to 3 families", time: "18 min ago" },
      { title: "Bill of Sale signed", detail: "Emma Harris · Clover", time: "1 hr ago" },
      { title: "Weight alert cleared", detail: "Biscuit gained 0.7 oz since yesterday", time: "3 hrs ago" },
    ],
  },
  "cedar-creek": {
    slug: "cedar-creek",
    name: "Cedar & Creek Goldens",
    breed: "Golden Retriever",
    monogram: "CC",
    websiteLabel: "cedar-creek.mydogportal.site",
    websiteHref: "/templates/cedar-creek",
    domainType: "INCLUDED KENNEL ADDRESS",
    accent: "#a26d3d",
    accentDark: "#3f382c",
    greeting: "Good morning, Cedar & Creek",
    dogs: [
      { name: "Wren", role: "Dam", detail: "English Cream · OFA CHIC", status: "Pregnant" },
      { name: "August", role: "Sire", detail: "Golden · OFA CHIC", status: "Active" },
      { name: "Meadow", role: "Dam", detail: "Light Golden · OFA CHIC", status: "Resting" },
      { name: "River", role: "Sire", detail: "Dark Golden · OFA CHIC", status: "Active" },
    ],
    litter: { name: "Meadow × River", parents: "Meadow + River", born: "Jun 30, 2026", puppies: 7, reserved: 6, next: "Temperament evaluations · Aug 24" },
    breeding: { dam: "Wren", sire: "August", stage: "Pregnancy day 39", due: "Due Aug 31", progesterone: "Ovulation confirmed", coi: "3.2% projected COI" },
    families: [
      { name: "Olivia Grant", puppy: "Fern", stage: "Puppy assigned", balance: "$1,800" },
      { name: "Jason Reed", puppy: "Scout", stage: "Picking complete", balance: "$900" },
      { name: "Nora White", puppy: "Sunny", stage: "Go-home prep", balance: "Paid" },
    ],
    activity: [
      { title: "Pregnancy milestone", detail: "Wren · day 39 care checklist opened", time: "12 min ago" },
      { title: "Application approved", detail: "The Bennett family joined the waitlist", time: "2 hrs ago" },
      { title: "Puppy Packet generated", detail: "Sunny · 8 documents prepared", time: "Yesterday" },
    ],
  },
  "northstar-poodles": {
    slug: "northstar-poodles",
    name: "Northstar Standard Poodles",
    breed: "Standard Poodle",
    monogram: "NS",
    websiteLabel: "northstar.mydogportal.site",
    websiteHref: "/templates/northstar-poodles",
    domainType: "INCLUDED KENNEL ADDRESS",
    accent: "#856c54",
    accentDark: "#292724",
    greeting: "Good morning, Northstar",
    dogs: [
      { name: "Celeste", role: "Dam", detail: "Black · CHIC complete", status: "Cycling" },
      { name: "Atlas", role: "Sire", detail: "Silver beige · CHIC complete", status: "Active" },
      { name: "Violet", role: "Dam", detail: "Blue · CHIC complete", status: "Resting" },
      { name: "Sterling", role: "Sire", detail: "Silver · CHIC complete", status: "Active" },
    ],
    litter: { name: "Violet × Sterling", parents: "Violet + Sterling", born: "Jul 8, 2026", puppies: 8, reserved: 5, next: "Structure notes · Aug 19" },
    breeding: { dam: "Celeste", sire: "Atlas", stage: "Progesterone series", due: "Pending breeding date", progesterone: "6.4 ng/mL · Aug 7", coi: "2.1% projected COI" },
    families: [
      { name: "Grace Palmer", puppy: "Noelle", stage: "Selection scheduled", balance: "$2,000" },
      { name: "Mark Ellis", puppy: "Arlo", stage: "Weekly updates", balance: "$1,250" },
      { name: "Sofia Lane", puppy: "TBD", stage: "#3 picking order", balance: "Deposit paid" },
    ],
    activity: [
      { title: "Progesterone result added", detail: "Celeste · 6.4 ng/mL", time: "9 min ago" },
      { title: "Pedigree analysis saved", detail: "Celeste × Atlas · COI 2.1%", time: "48 min ago" },
      { title: "Picking reminder queued", detail: "Grace Palmer · tomorrow 2:00 PM", time: "3 hrs ago" },
    ],
  },
  "bluebird-aussies": {
    slug: "bluebird-aussies",
    name: "Bluebird Aussies",
    breed: "Australian Shepherd",
    monogram: "BA",
    websiteLabel: "bluebird.mydogportal.site",
    websiteHref: "/templates/bluebird-aussies",
    domainType: "INCLUDED KENNEL ADDRESS",
    accent: "#287f98",
    accentDark: "#173f50",
    greeting: "Good morning, Bluebird",
    dogs: [
      { name: "Juniper", role: "Dam", detail: "Blue merle · Red factored", status: "Nursing" },
      { name: "Ranger", role: "Sire", detail: "Black tri · Clear panel", status: "Active" },
      { name: "Sage", role: "Dam", detail: "Red tri · Clear panel", status: "Planning" },
      { name: "Flynn", role: "Sire", detail: "Blue merle · MDR1 N/M", status: "Active" },
    ],
    litter: { name: "Juniper × Ranger", parents: "Juniper + Ranger", born: "Jul 25, 2026", puppies: 6, reserved: 4, next: "ENS week complete · Aug 11" },
    breeding: { dam: "Sage", sire: "Flynn", stage: "Planned pairing", due: "Target litter Nov 2026", progesterone: "Heat expected Sep 2", coi: "5.0% projected COI" },
    families: [
      { name: "Kayla Brooks", puppy: "Piper", stage: "Weekly updates", balance: "$1,400" },
      { name: "Daniel Ross", puppy: "Moss", stage: "Deposit received", balance: "$1,750" },
      { name: "Avery King", puppy: "TBD", stage: "#2 picking order", balance: "Deposit paid" },
    ],
    activity: [
      { title: "Daily weights complete", detail: "6 of 6 puppies logged", time: "6 min ago" },
      { title: "Family photos published", detail: "Juniper × Ranger · week 2", time: "31 min ago" },
      { title: "Waitlist advanced", detail: "Avery King moved to picking position #2", time: "2 hrs ago" },
    ],
  },
  "ironwood-shepherds": {
    slug: "ironwood-shepherds",
    name: "Ironwood German Shepherds",
    breed: "German Shepherd",
    monogram: "IW",
    websiteLabel: "ironwood.mydogportal.site",
    websiteHref: "/templates/ironwood-shepherds",
    domainType: "INCLUDED KENNEL ADDRESS",
    accent: "#bd392e",
    accentDark: "#202628",
    greeting: "Good morning, Ironwood",
    dogs: [
      { name: "Freya", role: "Dam", detail: "Black & red · IGP1", status: "Pregnant" },
      { name: "Valko", role: "Sire", detail: "Black & red · IGP3", status: "Active" },
      { name: "Kira", role: "Dam", detail: "Sable · BH-VT", status: "Resting" },
      { name: "Odin", role: "Sire", detail: "Dark sable · IGP2", status: "Active" },
    ],
    litter: { name: "Kira × Odin", parents: "Kira + Odin", born: "Jun 18, 2026", puppies: 7, reserved: 7, next: "Working evaluations · Aug 15" },
    breeding: { dam: "Freya", sire: "Valko", stage: "Pregnancy day 45", due: "Due Aug 25", progesterone: "Breeding window complete", coi: "3.7% projected COI" },
    families: [
      { name: "Chris Wagner", puppy: "Rook", stage: "Training notes", balance: "Paid" },
      { name: "Leah Stone", puppy: "Hex", stage: "Go-home prep", balance: "$1,100" },
      { name: "Matt Price", puppy: "TBD", stage: "Next litter waitlist", balance: "Deposit paid" },
    ],
    activity: [
      { title: "Whelping countdown", detail: "Freya · 18 days remaining", time: "14 min ago" },
      { title: "Health record attached", detail: "Valko · annual orthopedic record", time: "1 hr ago" },
      { title: "Go-home checklist", detail: "Hex · 7 of 9 items complete", time: "Yesterday" },
    ],
  },
};

export const demoSlugs = Object.keys(demoKennels);
