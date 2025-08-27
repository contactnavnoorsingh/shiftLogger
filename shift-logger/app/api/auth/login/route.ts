import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, password } = await request.json();
    const user = await User.findOneAndUpdate(
        { username: username.toLowerCase() },
        { lastLogin: new Date(), onlineStatus: 'Online' },
        { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Log failed attempt but don't update status
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    const userResponse = { _id: user._id, username: user.username, fullName: user.fullName, isAdmin: user.isAdmin };
    return NextResponse.json({ token, user: userResponse });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
