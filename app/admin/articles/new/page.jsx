// /app/app/admin/articles/new/page.jsx
// New article — wraps ArticleForm inside AdminGate.

'use client'

import AdminGate from '@/components/admin/AdminGate'
import ArticleForm from '@/components/admin/ArticleForm'

export default function NewArticlePage() {
  return (
    <AdminGate title="New Article" backHref="/admin/articles">
      <ArticleForm mode="create" />
    </AdminGate>
  )
}
