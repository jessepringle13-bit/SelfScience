// /app/lib/kits.js
// Data for the /get-started page. Kept as a plain JS module so the page
// stays declarative and copy edits don't require touching JSX.

export const GENOME_KITS_TIER1 = [
  {
    id: '23andme',
    name: '23andMe',
    price: '~$99–$229 depending on tier',
    formats: ['.txt', '.zip'],
    coverage: '~700,000 SNPs',
    bestFor: 'First-time users. The most widely used consumer DNA kit. Health + Ancestry kit ($199) gives the most SNP coverage.',
    quality: 'Industry standard. Well-established genotyping chip. Raw data downloads within minutes of requesting.',
    url: 'https://www.23andme.com',
  },
  {
    id: 'ancestrydna',
    name: 'AncestryDNA',
    price: '~$99',
    formats: ['.txt', '.zip'],
    coverage: '~700,000 SNPs',
    bestFor: 'Budget-conscious users or those already interested in ancestry. Largest DNA database in the world.',
    quality: 'Reliable and affordable. Solid SNP coverage for SelfScience’s variant library. Download takes up to 24 hours after requesting.',
    url: 'https://www.ancestry.com/dna',
  },
  {
    id: 'myheritage',
    name: 'MyHeritage DNA',
    price: '~$79',
    formats: ['.txt', '.zip'],
    coverage: '~700,000 SNPs',
    bestFor: 'Budget option. Good international database. File format was updated in January 2026 and is confirmed compatible with SelfScience.',
    quality: 'Reliable genotyping chip. Slightly lower price point than 23andMe or Ancestry. Raw data available for download once results are ready.',
    url: 'https://www.myheritage.com/dna',
  },
  {
    id: 'familytreedna',
    name: 'FamilyTreeDNA',
    price: '~$79',
    formats: ['.txt', '.zip'],
    coverage: '~700,000 SNPs',
    bestFor: 'Users interested in deep ancestry and paternal/maternal lineage alongside health variants. Strong Y-DNA and mtDNA coverage.',
    quality: 'Solid raw data access. Good SNP coverage for health-relevant variants. Download available directly from account dashboard.',
    url: 'https://www.familytreedna.com',
  },
]

export const GENOME_KITS_TIER2 = [
  {
    id: 'nebula',
    name: 'Nebula Genomics',
    price: '~$299',
    formats: ['.vcf'],
    coverage: '100% of genome (30x depth)',
    bestFor: 'Users who want the most complete genomic picture available. 30x sequencing depth means each base pair is read ~30 times for accuracy. The gold standard for consumer WGS.',
    quality: 'Highest data completeness available to consumers. Produces CRAM, FASTQ, and VCF files — download the VCF for SelfScience upload. Results typically ready in 6–8 weeks.',
    url: 'https://nebula.org',
  },
  {
    id: 'sequencing',
    name: 'Sequencing.com',
    price: '~$399',
    formats: ['.vcf'],
    coverage: '100% of genome (30x depth)',
    bestFor: 'Strong alternative to Nebula. Good platform for uploading WGS data and accessing multiple third-party apps alongside SelfScience.',
    quality: '30x whole genome sequencing. Produces VCF files compatible with SelfScience. Also offers a marketplace of health apps that can read your genome data.',
    url: 'https://sequencing.com',
  },
  {
    id: 'dantelabs',
    name: 'Dante Labs',
    price: '~$350+',
    formats: ['.vcf'],
    coverage: '100% of genome (30x depth)',
    bestFor: 'Advanced users comfortable with large data files. European-based service with strong clinical-grade sequencing.',
    quality: 'Clinical-grade WGS. Produces multiple VCF file types (SNP, INDEL, CNV, SV). Use the SNP VCF file for SelfScience upload. Results can take 8–12 weeks.',
    url: 'https://dantelabs.com',
  },
]

export const BLOOD_KITS = [
  {
    id: 'function-health',
    name: 'Function Health',
    price: '~$499/year (includes 2 full panels)',
    biomarkers: '160+ biomarkers per panel',
    bestFor: 'Users who want the most comprehensive annual bloodwork available. Covers metabolic, cardiovascular, hormonal, inflammatory, and longevity markers. Used by Peter Attia, Andrew Huberman, and many longevity-focused physicians.',
    quality: 'Gold standard for comprehensive consumer bloodwork. 160+ markers including ApoB, Lp(a), homocysteine, ferritin, free testosterone, SHBG, Vitamin D, hs-CRP, HbA1c, fasting insulin, and many more. Lab visit required at a draw site.',
    url: 'https://functionhealth.com',
  },
  {
    id: 'marek',
    name: 'Marek Health',
    price: '~$200–$400 depending on panel',
    biomarkers: '50–100+ biomarkers',
    bestFor: 'Performance-focused users. Strong panels for hormones, metabolic markers, and longevity labs. Popular in the biohacking and athletic optimization community.',
    quality: 'Uses LabCorp-certified labs. Order online, draw at your nearest LabCorp location. Good breadth of hormone and metabolic panels.',
    url: 'https://marekhealth.com',
  },
  {
    id: 'ulta',
    name: 'Ulta Lab Tests',
    price: '~$30–$200 per test or panel',
    biomarkers: '500+ individual tests available',
    bestFor: 'Users who want to order specific individual markers without a full panel. Most affordable option for targeted testing (e.g. just Vitamin D, ferritin, or homocysteine).',
    quality: 'Uses Quest Diagnostics labs. Order online, draw at Quest locations nationwide. Results typically in 1–3 business days.',
    url: 'https://ultalabtests.com',
  },
  {
    id: 'quest',
    name: 'Quest Health',
    price: '~$30–$300',
    biomarkers: '150+ individual tests available',
    bestFor: 'Same clinical-grade labs that physicians use. Good option if you want to order the exact same tests your doctor would order without a physician referral.',
    quality: 'Direct-to-consumer access to Quest Diagnostics lab network. Same clinical-grade testing used by hospitals and medical practices. Results accessible online within 1–3 days.',
    url: 'https://questhealth.com',
  },
  {
    id: 'noom',
    name: 'Noom Biomarker Kit',
    price: '~$125',
    biomarkers: '17 biomarkers',
    bestFor: 'Users who want a convenient at-home option without visiting a lab. Metabolic and cardiovascular focus. Uses Tasso+ at-home finger-prick collection mailed back to a certified lab.',
    quality: 'Most convenient entry point. Covers HbA1c, fasting glucose, lipids, and key metabolic markers. Fewer biomarkers than a full panel but zero lab visit required.',
    url: 'https://noom.com',
  },
]

export const DECISION_HELPER = [
  { id: 'a', label: 'I want to try SelfScience for the first time on a budget', pick: 'AncestryDNA or MyHeritage', price: '~$79–$99' },
  { id: 'b', label: 'I want the best genotyping kit with the most health data',  pick: '23andMe Health + Ancestry', price: '~$199' },
  { id: 'c', label: 'I want my complete genome and the most SelfScience can analyze', pick: 'Nebula Genomics', price: '~$299' },
]

export const DOWNLOAD_STEPS = [
  {
    kit: '23andMe',
    file: 'Look for a .zip archive; extract to reveal the .txt raw data file.',
    steps: [
      'Log into your 23andMe account.',
      'Click your profile name → Settings → scroll to “23andMe Data” → click View.',
      'Click “Download Raw Data” → check the consent box → Submit Request.',
      'You’ll receive an email when ready (usually within minutes). Download the .zip file.',
      'Upload the .zip or extracted .txt file to SelfScience.',
    ],
  },
  {
    kit: 'AncestryDNA',
    file: 'A single .txt file inside a .zip archive.',
    steps: [
      'Log into Ancestry → click your username → Account Settings → DNA.',
      'Scroll to the Download section → click Download.',
      'Check the consent box → Confirm — Ancestry will email you a download link.',
      'Check your inbox (can take up to 24 hours) → click the link → Download DNA Data.',
      'Upload the downloaded file to SelfScience.',
    ],
  },
  {
    kit: 'MyHeritage',
    file: 'A .csv or .txt file inside a .zip archive.',
    steps: [
      'Log into MyHeritage → click your name → DNA.',
      'Click “Retrieve raw data” → verify your identity.',
      'Download the raw data file when ready.',
      'Upload to SelfScience.',
    ],
  },
  {
    kit: 'FamilyTreeDNA',
    file: 'A .txt file downloaded directly from the account dashboard.',
    steps: [
      'Log into FamilyTreeDNA → click your kit name.',
      'Go to “Download Raw Data” from the account menu.',
      'Download the .txt file.',
      'Upload to SelfScience.',
    ],
  },
  {
    kit: 'Nebula Genomics',
    file: 'A .vcf (or .vcf.gz) file. Do not use CRAM or FASTQ for SelfScience.',
    steps: [
      'Log into your Nebula account.',
      'Click “Download your data” in the top right corner.',
      'Select Download under the VCF file (not CRAM or FASTQ).',
      'Upload the .vcf file directly to SelfScience.',
    ],
  },
  {
    kit: 'Sequencing.com / Dante Labs',
    file: 'SNP VCF file (.vcf or .vcf.gz). Dante Labs also offers INDEL/CNV/SV VCFs — use the SNP one.',
    steps: [
      'Log into your account → navigate to your Results or Data section.',
      'Download your SNP VCF file (.vcf or .vcf.gz).',
      'Upload to SelfScience.',
    ],
  },
]
