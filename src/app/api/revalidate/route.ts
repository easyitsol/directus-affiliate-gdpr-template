import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Sichern Sie Ihren Endpunkt!
  if (secret !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');

  if (!path) {
    return NextResponse.json({ message: 'Missing path param' }, { status: 400 });
  }

  // Hier wird der Cache für den spezifischen Pfad geleert.
  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path: path, now: Date.now() });
}