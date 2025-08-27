import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';
import User from '@/models/User';
import axios from 'axios';

export async function POST(request: Request) {
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
        
        const { shiftId } = await request.json();
        const shift = await Shift.findById(shiftId).populate('userId', 'fullName');
        if (!shift) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        const populatedUser = shift.userId as any;
        const guardName = populatedUser && populatedUser.fullName ? populatedUser.fullName : 'N/A';

        const logBody = shift.entries.sort((a,b) => a.time.localeCompare(b.time)).map(e => e.text).join('\n');
        const fullReport = `Guard: ${guardName}\nDate: ${shift.date}\nShift: ${shift.timings}\nDesignation: ${shift.designation}\n\n---\n\n${logBody}`;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ summary: "AI summary not available. API key not configured." });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { 
                    role: 'system', 
                    // FIX: Updated prompt to be more robust for long reports and industry standards.
                    content: "You are a security analyst tasked with creating an executive summary from a raw shift log. Your summary must be professional, concise, and structured with clear headings. Start with 'Executive Summary for Shift [Date]'. Focus on identifying and summarizing key incidents, anomalies, resolutions, and any outstanding issues. If the log is long and contains many routine patrols, briefly mention that routine patrols were conducted but focus the bulk of the summary on non-routine events. Do not list every single patrol." 
                },
                { role: 'user', content: fullReport }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        
        const summary = response.data?.choices?.[0]?.message?.content?.trim() || "Could not generate summary.";
        return NextResponse.json({ summary });

    } catch (error: any) {
        console.error("Error generating executive summary:", error);
        const errorMessage = error.response?.data?.error?.message || 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
