import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';

export async function DELETE(request: Request, { params }: { params: { id: string; index: string } }) {
    await dbConnect();
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const entryIndex = parseInt(params.index, 10);

        const shift = await Shift.findOne({ _id: params.id, userId: decoded.userId });

        if (!shift) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        if (isNaN(entryIndex) || entryIndex < 0 || entryIndex >= shift.entries.length) {
            return NextResponse.json({ error: 'Invalid entry index' }, { status: 400 });
        }

        // Remove the entry from the array
        shift.entries.splice(entryIndex, 1);

        shift.markModified('entries');
        await shift.save();

        return NextResponse.json({ success: true, shift });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        console.error("Error in delete entry route:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
