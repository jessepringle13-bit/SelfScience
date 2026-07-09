import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'selfscience', version: '0.1.0' })
}

export async function POST() {
  return NextResponse.json({ status: 'ok' })
}
