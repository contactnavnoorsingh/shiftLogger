import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, password } = await request.json();

    // Validate username and password
    if (
      !username ||
      !password ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username.length < 3 ||
      password.length < 6
    ) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters and password at least 6 characters.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({ username: username.toLowerCase(), passwordHash });
    await newUser.save();

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return NextResponse.json({ token, user: { _id: newUser._id, username: newUser.username } });
  } catch (error: any) {
    // In development, return error message for debugging
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}