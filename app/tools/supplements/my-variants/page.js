import MyVariantsClient from './my-variants-client'
export const metadata = {
  title: 'My variants · Supplements — SelfScience',
  description: 'Every personalisation signal from your genome + biomarkers, in one place. Client-side only. Not medical advice.',
  robots: { index: false, follow: true },
}
export default function Page() { return <MyVariantsClient /> }
