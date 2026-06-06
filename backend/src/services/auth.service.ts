import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { env } from '../config/env';

export const register = async (body: any) => {
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const { password, ...userData } = body;
  const user = await prisma.user.create({
    data: { ...userData, passwordHash },
  });
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } };
};
