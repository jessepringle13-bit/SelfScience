// /app/app/tools/training/page.js

import TrainingProtocolClient from './training-protocol-client'

export const metadata = {
  title: 'Training Protocol Engine · SelfScience',
  description:
    'A fully personalised, evidence-based training protocol built from your genetic variants and biomarker data. Works with your current sport — never asks you to stop what you love.',
}

export default function TrainingProtocolPage() {
  return <TrainingProtocolClient />
}
