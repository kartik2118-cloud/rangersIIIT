import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserById, isWalletCreated } from '@/lib/db';

export async function GET() {
  const jwtUser = await getAuthUser();
  if (!jwtUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const user = getUserById(jwtUser.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      college: user.college,
      rollNumber: user.rollNumber,
      walletCreated: isWalletCreated(user.id),
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    },
  });
}
