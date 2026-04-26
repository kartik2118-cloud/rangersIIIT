import { NextResponse } from 'next/server';
import { FESTS } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ success: true, data: FESTS });
}
