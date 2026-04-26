import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { setWalletCreated } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const jwtUser = await getAuthUser();
    if (!jwtUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
    }

    // Simulate smart account creation delay
    await new Promise(r => setTimeout(r, 1500));

    await setWalletCreated(jwtUser.userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Wallet creation failed.' }, { status: 500 });
  }
}
