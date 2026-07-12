// /app/app/admin/layout.jsx
// Admin shell (dark UI). Does NOT gate access itself — individual pages
// call /api/admin/me and redirect to /admin/login if unauthenticated.
// This keeps SSR simple; auth is a client-side check backed by the
// httpOnly cookie.

export const metadata = {
  title: 'SelfScience Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {children}
    </div>
  )
}
