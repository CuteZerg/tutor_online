import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://tutoronline-rb4lztss.livekit.cloud',
  });
}
