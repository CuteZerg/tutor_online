import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || ''
  });
}
