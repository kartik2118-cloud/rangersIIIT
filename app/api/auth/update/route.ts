import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateProfile } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const jwtUser = await getAuthUser();
    if (!jwtUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
    }

    const { college, rollNumber } = await req.json();

    if (!college || !rollNumber) {
      return NextResponse.json({ success: false, error: 'College and Roll Number are required.' }, { status: 400 });
    }

    const updated = await updateProfile(jwtUser.userId, { college, rollNumber });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
