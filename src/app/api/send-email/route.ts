import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { to, subject, body } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ message: 'Missing required fields: to, subject, body' }, { status: 400 });
  }

  console.log('------------------------------------');
  console.log('Email sending simulation:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:`);
  console.log(body);
  console.log('------------------------------------');


  return NextResponse.json({ message: 'Email simulated sent' }, { status: 200 });
}