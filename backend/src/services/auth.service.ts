import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { env } from '../config/env';

export const register = async (body: any) => {
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const { firstName, lastName, email, phone, role, country } = body;
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      role,
      country,
      passwordHash,
    },
  });

  if (role === 'VENDOR') {
    await prisma.vendor.create({
      data: {
        userId: user.id,
        companyName: body.companyName || `${firstName} ${lastName} Corp`,
        category: body.category || 'General',
        gstNumber: body.gstNumber || `27${Math.random().toString(36).substring(2, 7).toUpperCase()}1234A1Z5`,
        contactPhone: phone || '0000000000',
        address: country || '',
      }
    });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(404, 'No user found with this email address');

  const secret = env.JWT_SECRET + user.passwordHash;
  const token = jwt.sign({ id: user.id }, secret, { expiresIn: '15m' });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}&id=${user.id}`;
  
  let sent = false;
  try {
    const { sendResetPasswordEmail } = require('./email.service');
    await sendResetPasswordEmail(user.email, resetUrl);
    sent = true;
  } catch (err) {
    console.error('SMTP email send failed. Reset URL logged to console: ', resetUrl);
  }

  return { resetUrl, sent };
};

export const resetPassword = async (userId: string, token: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const secret = env.JWT_SECRET + user.passwordHash;
  try {
    jwt.verify(token, secret);
  } catch (err) {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};
