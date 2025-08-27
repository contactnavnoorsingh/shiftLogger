import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const { status } = await request.json();
    if (status !== 'Online' && status !== 'Offline') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await User.findByIdAndUpdate(decoded.userId, { onlineStatus: status });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
