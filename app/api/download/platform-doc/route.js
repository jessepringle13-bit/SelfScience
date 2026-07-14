// /app/app/api/download/platform-doc/route.js
// Serves the SelfScience platform documentation as a downloadable Markdown
// file. Sets Content-Disposition: attachment so browsers save it instead
// of trying to render it inline.

import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'selfscience-platform.md')
    const body = await readFile(filePath, 'utf-8')
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="SelfScience-Platform.md"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Documentation file not found', detail: err?.message },
      { status: 404 },
    )
  }
}
