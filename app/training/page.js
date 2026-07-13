// Legacy /training URL — redirect to the new Training Protocol Engine
// under /tools/training so old bookmarks and internal links still work.

import { redirect } from 'next/navigation'

export default function LegacyTrainingRedirect() {
  redirect('/tools/training')
}
