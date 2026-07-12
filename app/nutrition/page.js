import NutritionClient from './nutrition-client'

export const metadata = {
  title: 'Nutrition Hub — SelfScience',
  description:
    'Genomic nutrition intelligence: food recommendations, a daily food journal, and a product scanner that reads ingredient labels through the lens of your genetic variants.',
}

export default function NutritionHubPage() {
  return <NutritionClient />
}
