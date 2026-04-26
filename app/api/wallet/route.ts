import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserWallet } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });

  const wallet = getUserWallet(user.userId);
  if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found.' }, { status: 404 });

  return NextResponse.json({ success: true, data: wallet });
}
