import GenomeClient from './genome-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Upload your genome',
  description:
    'Upload a 23andMe, AncestryDNA, or VCF file. SelfScience parses it in your browser (your file never touches our servers) and builds a personalised research roadmap.',
  alternates: { canonical: '/genome' },
  openGraph: {
    title: 'Upload your genome | SelfScience',
    description:
      'Browser-only genome parsing across ~500 well-studied variants, plus AI-generated research roadmap. Your file never leaves your device.',
    url: '/genome',
    type: 'website',
  },
}

export default function GenomePage() {
  return <GenomeClient />
}
