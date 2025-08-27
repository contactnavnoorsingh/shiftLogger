import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';

// New PUT method for editing an entry
export async function PUT(request: Request, { params }: { params: { id: string; index: string } }) {
    await dbConnect();
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const { updatedText, updatedTime } = await request.json();
        const entryIndex = parseInt(params.index, 10);

        const shift = await Shift.findOne({ _id: params.id, userId: decoded.userId });
        if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        if (shift.status === 'Completed') return NextResponse.json({ error: 'Cannot edit a completed shift' }, { status: 403 });

        if (isNaN(entryIndex) || !shift.entries[entryIndex]) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
        
        // Update text and time
        const originalText = shift.entries[entryIndex].text;
        const newText = `${updatedTime} ${originalText.substring(6)}`; // Keep status and description
        shift.entries[entryIndex].text = newText;
        shift.entries[entryIndex].time = updatedTime;

        shift.markModified('entries');
        await shift.save();

        return NextResponse.json({ success: true, shift });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string; index: string } }) {
    await dbConnect();
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const entryIndex = parseInt(params.index, 10);
        const shift = await Shift.findOne({ _id: params.id, userId: decoded.userId });

        if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        if (shift.status === 'Completed') return NextResponse.json({ error: 'Cannot delete from a completed shift' }, { status: 403 });

        if (isNaN(entryIndex) || entryIndex < 0 || entryIndex >= shift.entries.length) {
            return NextResponse.json({ error: 'Invalid entry index' }, { status: 400 });
        }

        shift.entries.splice(entryIndex, 1);
        shift.markModified('entries');
        await shift.save();

        return NextResponse.json({ success: true, shift });
    } catch (error) {
        console.error("Error in delete entry route:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
