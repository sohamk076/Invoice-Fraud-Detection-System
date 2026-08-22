import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { APP_CONFIG } from '../config/constants';
import { AuditService } from './audit.service';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  phone?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
  ipAddress?: string;
}

export class AuthService {
  public static async register(input: RegisterUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: input.role || 'FINANCE_USER',
        department: input.department || 'Finance & Accounts',
        phone: input.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.role);

    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: `User account created for ${user.name} (${user.email}) with role ${user.role}.`,
    });

    return { user, token };
  }

  public static async login(input: LoginUserInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken(user.id, user.role);

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: input.ipAddress,
      details: `User ${user.name} logged into the system.`,
    });

    const { passwordHash, ...userProfile } = user;
    return { user: userProfile, token };
  }

  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }

  public static generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      APP_CONFIG.JWT_SECRET,
      { expiresIn: APP_CONFIG.JWT_EXPIRES_IN as any }
    );
  }
}
