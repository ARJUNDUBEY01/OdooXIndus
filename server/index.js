import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Otp from './models/Otp.js';

dotenv.config({ path: '../.env' }); // Make sure it reads from root .env

const app = express();
app.use(express.json());
app.use(cors());

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// 1. Send OTP
app.post('/api/otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  try {
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your RevFlow OTP',
      text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Verify OTP
app.post('/api/otp/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    const record = await Otp.findOne({ email, otp });
    if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const verificationToken = crypto.randomBytes(32).toString('hex'); // Token returned after verification
    record.verifiedToken = verificationToken;
    await record.save();

    res.json({ message: 'OTP verified successfully', verifiedToken: verificationToken });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Reset Password (Direct via Supabase Admin API)
app.post('/api/otp/reset', async (req, res) => {
  const { email, verifiedToken, newPassword } = req.body;
  if (!email || !verifiedToken || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const record = await Otp.findOne({ email, verifiedToken });
    if (!record) return res.status(400).json({ error: 'Verification required' });

    // Find the user by fetching all and filtering (same logic as before)
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    const userToUpdate = users.users.find(u => u.email === email);
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userToUpdate.id,
      { password: newPassword }
    );
    if (updateError) throw updateError;

    await Otp.deleteOne({ email });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Auth Backend running on http://localhost:${PORT}`);
});
