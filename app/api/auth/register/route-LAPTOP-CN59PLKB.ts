import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, college, rollNumber, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const result = createUser({ name, email, college: college || '', rollNumber: rollNumber || '', password });

    if ('error' in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    const token = await signToken({ userId: result.user.id, email: result.user.email, name: result.user.name });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, college: result.user.college },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
