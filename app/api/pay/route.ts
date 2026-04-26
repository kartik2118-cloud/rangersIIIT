import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { processUserPayment } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const jwtUser = await getAuthUser();
    if (!jwtUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
    }

    const { festId, merchantId, amount, orderRef } = await req.json();

    if (!festId || !merchantId || !amount || !orderRef) {
      return NextResponse.json({ success: false, error: 'Missing payment parameters.' }, { status: 400 });
    }

    // Simulate blockchain confirmation delay
    await new Promise(r => setTimeout(r, 1200));

    const result = await processUserPayment(jwtUser.userId, { festId, merchantId, amount: Number(amount), orderRef });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      newBalance: result.newBalance,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Payment failed.' }, { status: 500 });
  }
}
