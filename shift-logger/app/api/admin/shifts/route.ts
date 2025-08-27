import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';
import User from '@/models/User';
import { NextURL } from 'next/dist/server/web/next-url';

export async function GET(request: Request) {
    await dbConnect();
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const user = await User.findById(decoded.userId);
        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new NextURL(request.url);
        const query: any = {};
        
        const userId = searchParams.get('userId');
        const designation = searchParams.get('designation');
        const date = searchParams.get('date');
        const text = searchParams.get('text');

        if (userId) query.userId = userId;
        if (designation) query.designation = { $regex: designation, $options: 'i' };
        if (date) query.date = date;
        if (text) {
            query.$or = [
                { 'entries.text': { $regex: text, $options: 'i' } },
                { summary: { $regex: text, $options: 'i' } }
            ];
        }

        const shifts = await Shift.find(query).populate('userId', 'fullName onlineStatus lastLogin').sort({ startTime: -1 });
        return NextResponse.json({ shifts });

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
