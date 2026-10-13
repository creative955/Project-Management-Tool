/**
 * Client roster for the demo agency. Seeded into CRM Accounts/Contacts/Opportunities
 * in phase 5 and into Accounting customers in phase 9. Amounts are minor units.
 */
export interface SeedClient {
  key: string;
  name: string;
  domain: string;
  country: "US" | "GB" | "AU" | "AE" | "SA" | "QA" | "IN";
  city: string;
  industry: string;
  currency: "USD" | "GBP" | "AUD" | "AED" | "SAR" | "QAR" | "INR";
  engagement: "retainer" | "project";
  annualValueMinor: bigint;
  owner: string;
  contact: { name: string; title: string; email: string; phone: string };
}

export const CLIENTS: SeedClient[] = [
  { key: "brightwave", name: "Brightwave Health", domain: "brightwavehealth.com", country: "US", city: "Boston", industry: "Healthcare", currency: "USD", engagement: "retainer", annualValueMinor: 18_000_000n, owner: "james", contact: { name: "Rachel Kim", title: "VP Marketing", email: "rachel.kim@brightwavehealth.com", phone: "+1 617 555 0142" } },
  { key: "copperline", name: "Copperline Outdoor", domain: "copperline.co", country: "US", city: "Denver", industry: "Retail", currency: "USD", engagement: "project", annualValueMinor: 6_500_000n, owner: "james", contact: { name: "Tyler Brooks", title: "Head of Ecommerce", email: "tyler@copperline.co", phone: "+1 303 555 0187" } },
  { key: "northgate", name: "Northgate Labs", domain: "northgatelabs.io", country: "US", city: "San Francisco", industry: "SaaS", currency: "USD", engagement: "project", annualValueMinor: 9_800_000n, owner: "james", contact: { name: "Priyanka Shah", title: "Product Marketing Lead", email: "priyanka@northgatelabs.io", phone: "+1 415 555 0119" } },
  { key: "thamesrowe", name: "Thames & Rowe Bank", domain: "thamesrowe.co.uk", country: "GB", city: "London", industry: "Financial services", currency: "GBP", engagement: "retainer", annualValueMinor: 14_400_000n, owner: "james", contact: { name: "Oliver Hughes", title: "Brand Director", email: "oliver.hughes@thamesrowe.co.uk", phone: "+44 20 7946 0321" } },
  { key: "fable", name: "Fable Kitchen", domain: "fablekitchen.co.uk", country: "GB", city: "Manchester", industry: "Food & beverage", currency: "GBP", engagement: "project", annualValueMinor: 3_200_000n, owner: "james", contact: { name: "Hannah Price", title: "Founder", email: "hannah@fablekitchen.co.uk", phone: "+44 161 496 0754" } },
  { key: "harbourline", name: "Harbourline Coffee", domain: "harbourline.com.au", country: "AU", city: "Melbourne", industry: "Food & beverage", currency: "AUD", engagement: "retainer", annualValueMinor: 9_600_000n, owner: "james", contact: { name: "Liam Carter", title: "Marketing Director", email: "liam@harbourline.com.au", phone: "+61 3 9555 0188" } },
  { key: "saltbush", name: "Saltbush Travel", domain: "saltbushtravel.com.au", country: "AU", city: "Sydney", industry: "Travel", currency: "AUD", engagement: "project", annualValueMinor: 4_800_000n, owner: "james", contact: { name: "Grace Nguyen", title: "Digital Manager", email: "grace@saltbushtravel.com.au", phone: "+61 2 9555 0107" } },
  { key: "alnoor", name: "Al Noor Properties", domain: "alnoorproperties.ae", country: "AE", city: "Dubai", industry: "Real estate", currency: "AED", engagement: "retainer", annualValueMinor: 66_000_000n, owner: "omar", contact: { name: "Khalid Rahman", title: "Marketing Manager", email: "khalid@alnoorproperties.ae", phone: "+971 4 555 0134" } },
  { key: "qamar", name: "Qamar Hospitality", domain: "qamarhotels.qa", country: "QA", city: "Doha", industry: "Hospitality", currency: "QAR", engagement: "project", annualValueMinor: 28_000_000n, owner: "omar", contact: { name: "Noura Al Thani", title: "Director of Brand", email: "noura@qamarhotels.qa", phone: "+974 4455 0199" } },
  { key: "sahara", name: "Sahara Mobility", domain: "saharamobility.sa", country: "SA", city: "Riyadh", industry: "Automotive", currency: "SAR", engagement: "project", annualValueMinor: 37_500_000n, owner: "omar", contact: { name: "Faisal Al Otaibi", title: "CMO", email: "faisal@saharamobility.sa", phone: "+966 11 555 0163" } },
  { key: "indus", name: "Indus Mutual Fund", domain: "indusmf.in", country: "IN", city: "Mumbai", industry: "Financial services", currency: "INR", engagement: "retainer", annualValueMinor: 4_200_000_00n, owner: "priya", contact: { name: "Vikram Sethi", title: "Head of Marketing", email: "vikram.sethi@indusmf.in", phone: "+91 22 5555 0178" } },
  { key: "tiffin", name: "Tiffin & Co", domain: "tiffinandco.in", country: "IN", city: "Bengaluru", industry: "D2C food", currency: "INR", engagement: "project", annualValueMinor: 1_850_000_00n, owner: "priya", contact: { name: "Neha Bhat", title: "Co-founder", email: "neha@tiffinandco.in", phone: "+91 80 5555 0121" } },
  { key: "veda", name: "Veda Ayurveda", domain: "vedaayurveda.in", country: "IN", city: "Kochi", industry: "Wellness", currency: "INR", engagement: "project", annualValueMinor: 1_200_000_00n, owner: "priya", contact: { name: "Arun Menon", title: "Brand Manager", email: "arun@vedaayurveda.in", phone: "+91 484 555 0136" } },
];
