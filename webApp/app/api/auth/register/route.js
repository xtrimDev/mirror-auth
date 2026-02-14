import { NextResponse } from 'next/server';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request) {
  const res = await request.json();
  console.log(res );

  return NextResponse.json({ success: true, data: "" });
}
