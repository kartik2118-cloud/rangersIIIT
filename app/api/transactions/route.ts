import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserTxs } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });

  const txs = await getUserTxs(user.userId);
  return NextResponse.json({ success: true, data: txs });
}
