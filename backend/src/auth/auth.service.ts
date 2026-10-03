import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email.toLowerCase(),
      passwordHash,
      role: registerDto.role || 'Founder / CEO',
      defaultCurrency: registerDto.defaultCurrency || 'LKR',
      dateFormat: 'DD MMM YYYY',
      dashboardStartPage: 'Dashboard',
    });

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        defaultCurrency: user.defaultCurrency,
        dateFormat: user.dateFormat,
        dashboardStartPage: user.dashboardStartPage,
        monthlyTarget: user.monthlyTarget,
        yearlyTarget: user.yearlyTarget,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        defaultCurrency: user.defaultCurrency,
        dateFormat: user.dateFormat,
        dashboardStartPage: user.dashboardStartPage,
        monthlyTarget: user.monthlyTarget,
        yearlyTarget: user.yearlyTarget,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't leak user existence for security, or return user friendly message
      return {
        message: 'If that email exists in our system, a password reset token has been generated.',
        resetToken: null,
      };
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.usersService.save(user);

    return {
      message: 'Password reset token generated successfully.',
      resetToken, // Returned so UI can auto-populate or demonstrate reset flow seamlessly
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.password, salt);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await this.usersService.save(user);

    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}
