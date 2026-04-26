import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, college, rollNumber, password } = await req.json();
    if (!name || !email || !college || !rollNumber || !password)
      return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });

    const result = await createUser({ name, email, college, rollNumber, password });
    if ('error' in result)
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });

    const token = await signToken({ userId: result.id, email: result.email, name: result.name });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: result.id, name: result.name, email: result.email, college: result.college },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
