import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });

    const user = await verifyCredentials(email, password);
    if (!user)
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });

    const token = await signToken({ userId: user.id, email: user.email, name: user.name });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, college: user.college },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
