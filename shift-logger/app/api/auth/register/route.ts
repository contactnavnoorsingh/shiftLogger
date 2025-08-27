import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, password, fullName } = await request.json();

    if (
      !username || !password || !fullName ||
      typeof username !== 'string' || typeof password !== 'string' || typeof fullName !== 'string' ||
      username.length < 3 || password.length < 6 || fullName.length < 3
    ) {
      return NextResponse.json(
        { error: 'Username, password, and full name must be valid strings of sufficient length.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({ username: username.toLowerCase(), passwordHash, fullName });
    await newUser.save();

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userResponse = { _id: newUser._id, username: newUser.username, fullName: newUser.fullName, isAdmin: newUser.isAdmin };
    return NextResponse.json({ token, user: userResponse });
  } catch (error: any) {
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
