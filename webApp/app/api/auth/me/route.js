import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

