// /app/app/training/page.js

import TrainingClient from './training-client'

export const metadata = {
  title: 'Training Protocol · SelfScience',
  description: 'A variant-driven, research-framed training-emphasis protocol built from your genome findings.',
}

export default function TrainingPage() {
  return <TrainingClient />
}
