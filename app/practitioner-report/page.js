// /app/app/practitioner-report/page.js
import PractitionerReportClient from './practitioner-report-client'

export const metadata = {
  title: 'Practitioner Report · SelfScience',
  description:
    'A clinician-facing summary of the user\u2019s genome findings — printable, single-page, with PGx phenotype snapshot and lab context. Educational only.',
}

export default function PractitionerReportPage() {
  return <PractitionerReportClient />
}
