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
    
    const { entry, isUpdate, entryIndex } = await request.json();

    if (!entry || !entry.time || !entry.status || !entry.site || !entry.text) {
        return NextResponse.json({ error: 'Invalid entry structure' }, { status: 400 });
    }

    const shift = await Shift.findOne({ _id: params.id, userId: decoded.userId });

    if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    if (isUpdate && typeof entryIndex === 'number' && shift.entries[entryIndex]) {
        // This is an update to an existing in-progress entry
        shift.entries[entryIndex] = entry;
    } else {
        // This is a new entry
        shift.entries.push(entry);
    }

    shift.markModified('entries'); // Ensure nested array changes are saved
    await shift.save();

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error("Error in entries route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
