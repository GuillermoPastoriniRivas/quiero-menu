import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator.js';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { AuditService } from '../services/audit.service.js';
import {
  LoginRequestSchema,
  LoginRequestDto,
  SignupRequestSchema,
  SignupRequestDto,
  RefreshTokenRequestSchema,
  RefreshTokenRequestDto,
  VerifyEmailRequestSchema,
  VerifyEmailRequestDto,
  ForgotPasswordRequestSchema,
  ForgotPasswordRequestDto,
  ResetPasswordRequestSchema,
  ResetPasswordRequestDto,
} from '../request-dtos/auth.dto.js';
import type { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import type { SignupUseCase } from '../../application/use-cases/auth/signup.use-case.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case.js';
import type { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case.js';
import type { GetCurrentUserUseCase } from '../../application/use-cases/auth/get-current-user.use-case.js';
import type { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case.js';
import type { ResendVerificationUseCase } from '../../application/use-cases/auth/resend-verification.use-case.js';
import type { ForgotPasswordUseCase } from '../../application/use-cases/auth/forgot-password.use-case.js';
import type { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('LoginUseCase') private readonly loginUseCase: LoginUseCase,
    @Inject('SignupUseCase') private readonly signupUseCase: SignupUseCase,
    @Inject('RefreshTokenUseCase')
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject('LogoutUseCase')
    private readonly logoutUseCase: LogoutUseCase,
    private readonly audit: AuditService,
    @Inject('GetCurrentUserUseCase')
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    @Inject('VerifyEmailUseCase')
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    @Inject('ResendVerificationUseCase')
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    @Inject('ForgotPasswordUseCase')
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    @Inject('ResetPasswordUseCase')
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequestDto,
  ) {
    const result = await this.loginUseCase.execute(body);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    this.audit.log(
      'auth.login',
      result.value.user.id,
      result.value.user.restaurantId,
      { email: body.email },
    );
    return result.value;
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  async signup(
    @Body(new ZodValidationPipe(SignupRequestSchema)) body: SignupRequestDto,
  ) {
    const result = await this.signupUseCase.execute(body);
    if (!result.ok) throw new ConflictException(result.error.message);
    this.audit.log(
      'auth.signup',
      result.value.user.id,
      result.value.user.restaurantId,
      { email: body.email, slug: body.restaurantSlug },
    );
    return result.value;
  }

  @Public()
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenRequestSchema))
    body: RefreshTokenRequestDto,
  ) {
    const result = await this.refreshTokenUseCase.execute(body.refreshToken);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value;
  }

  @Public()
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @Post('logout')
  async logout(
    @Body(new ZodValidationPipe(RefreshTokenRequestSchema))
    body: RefreshTokenRequestDto,
  ) {
    await this.logoutUseCase.execute(body.refreshToken);
    this.audit.log('auth.logout');
    return { ok: true };
  }

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('verify-email')
  async verifyEmail(
    @Body(new ZodValidationPipe(VerifyEmailRequestSchema))
    body: VerifyEmailRequestDto,
  ) {
    const result = await this.verifyEmailUseCase.execute(body.token);
    if (!result.ok) throw new BadRequestException(result.error.message);
    this.audit.log('auth.email_verified');
    return { ok: true };
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordRequestSchema))
    body: ForgotPasswordRequestDto,
  ) {
    await this.forgotPasswordUseCase.execute(body.email);
    return { ok: true };
  }

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordRequestSchema))
    body: ResetPasswordRequestDto,
  ) {
    const result = await this.resetPasswordUseCase.execute(
      body.token,
      body.password,
    );
    if (!result.ok) throw new BadRequestException(result.error.message);
    this.audit.log('auth.password_reset');
    return { ok: true };
  }

  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(@CurrentUser() user: RequestUser) {
    const result = await this.resendVerificationUseCase.execute(user._id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    this.audit.log('auth.resend_verification', user._id, user.restaurantId);
    return { ok: true };
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const result = await this.getCurrentUserUseCase.execute(user._id);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value;
  }
}
