import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import type { FastifyInstance } from 'fastify';
import type { RegisterInput, LoginInput } from '@finera/shared';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;

export class AuthService {
  constructor(private readonly fastify: FastifyInstance) {}

  async register(input: RegisterInput) {
    const { prisma } = this.fastify;

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw Object.assign(new Error('Email już zajęty'), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const emailVerifyToken = nanoid(32);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerifyToken,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    await this.sendVerificationEmail(user.email, user.firstName, emailVerifyToken);

    return user;
  }

  async login(input: LoginInput, ipAddress?: string) {
    const { prisma } = this.fastify;

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw Object.assign(new Error('Nieprawidłowy email lub hasło'), { statusCode: 401 });
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Nieprawidłowy email lub hasło'), { statusCode: 401 });
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user.id, user.email),
      this.generateRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const { prisma } = this.fastify;

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, isActive: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const [accessToken, newRefreshToken] = await Promise.all([
      this.generateAccessToken(stored.user.id, stored.user.email),
      this.generateRefreshToken(stored.user.id),
    ]);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async verifyEmail(token: string) {
    const { prisma } = this.fastify;

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerified: false },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });
  }

  async logout(refreshToken: string) {
    const { prisma } = this.fastify;

    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async generateAccessToken(userId: string, email: string): Promise<string> {
    return this.fastify.jwt.sign(
      { sub: userId, email, type: 'access' },
      { expiresIn: '15m' }
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const { prisma } = this.fastify;
    const token = nanoid(REFRESH_TOKEN_BYTES);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
    return token;
  }

  private async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    this.fastify.log.info({ email, token }, 'Sending verification email (not implemented in dev)');
  }
}
