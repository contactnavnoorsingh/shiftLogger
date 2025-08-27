import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';
import User from '@/models/User';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const { summary, confirmationName } = await request.json();

        const user = await User.findById(decoded.userId);
        if (!user || user.fullName.toLowerCase() !== confirmationName.toLowerCase()) {
            return NextResponse.json({ error: 'Full name confirmation failed.' }, { status: 403 });
        }

        const shift = await Shift.findOneAndUpdate(
            { _id: params.id, userId: decoded.userId },
            { $set: { summary: summary, status: 'Completed' } },
            { new: true }
        );

        if (!shift) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }
        return NextResponse.json({ shift });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
