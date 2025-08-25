import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';
import { format } from 'date-fns';
import type { ShiftMode } from '@/types';

export async function GET(request: Request) {
  await dbConnect();
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const shifts = await Shift.find({ userId: decoded.userId }).sort({ startTime: -1 });
    return NextResponse.json({ shifts });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const { designation, startTime, endTime } = await request.json();

    if (!designation || !startTime || !endTime) {
      return NextResponse.json({ error: 'Designation, startTime, and endTime are required' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Assign a specific mode based on the designation
    let mode: ShiftMode;
    if (designation.includes('GTA Mobile')) mode = 'GTA_MOBILE';
    else if (designation.includes('Alarm Response')) mode = 'TPL_ALARM';
    else if (designation.includes('Parking Enforcement')) mode = 'TPL_PARKING';
    else if (designation.includes('Special Site Patrol')) mode = 'TPL_PATROL';
    else mode = 'TPL_MOBILE'; // Default for other TPL shifts

    const shiftData = {
      userId: decoded.userId,
      date: format(start, 'yyyy-MM-dd'),
      timings: `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`,
      designation,
      startTime: start,
      endTime: end,
      entries: [],
      mode,
    };
    
    const shift = new Shift(shiftData);
    await shift.save();

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
