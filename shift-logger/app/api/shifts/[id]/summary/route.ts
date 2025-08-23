import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const { summary } = await request.json();
    
    const shift = await Shift.findOneAndUpdate(
      { _id: params.id, userId: decoded.userId },
      { $set: { summary: summary } },
      { new: true }
    );

    if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }
    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}