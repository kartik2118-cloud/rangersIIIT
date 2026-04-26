import { NextResponse } from 'next/server';
import { findOrCreateFirebaseUser } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, name, uid } = await req.json();

    if (!email || !uid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const user = await findOrCreateFirebaseUser(email, name, uid);
    
    // Create payload matching JWTPayload interface
    const token = await signToken({ userId: user.id, email: user.email, name: user.name });

    // Set cookie using the correct internal utility (sets 'fp_token')
    await setAuthCookie(token);

    return NextResponse.json({ success: true, message: 'Firebase auth successful' });
  } catch (error) {
    console.error('Firebase auth error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
