import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';

export async function POST(request: Request, { params }: { params: { id: string; index: string } }) {
    await dbConnect();
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const { tenFour } = await request.json();
        const entryIndex = parseInt(params.index, 10);

        const shift = await Shift.findOne({ userId: decoded.userId, _id: params.id });
        if (!shift || !shift.entries[entryIndex]) {
            return NextResponse.json({ error: 'Shift or entry not found' }, { status: 404 });
        }

        const entry = shift.entries[entryIndex];
        entry.tenFour = tenFour;

        const tenFourText = " 10-4";
        const hasTenFour = entry.text.trim().endsWith(tenFourText);

        if (tenFour && !hasTenFour) {
            entry.text = entry.text.trim() + tenFourText;
        } else if (!tenFour && hasTenFour) {
            entry.text = entry.text.trim().slice(0, -tenFourText.length);
        }
        
        shift.markModified('entries');
        await shift.save();
        return NextResponse.json({ shift });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}