import { Controller, Post, Get, Body, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { LoginRequestSchema, LoginRequestDto, SignupRequestSchema, SignupRequestDto, RefreshTokenRequestSchema, RefreshTokenRequestDto } from '../request-dtos/auth.dto.js';
import type { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import type { SignupUseCase } from '../../application/use-cases/auth/signup.use-case.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case.js';
import type { GetCurrentUserUseCase } from '../../application/use-cases/auth/get-current-user.use-case.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('LoginUseCase') private readonly loginUseCase: LoginUseCase,
    @Inject('SignupUseCase') private readonly signupUseCase: SignupUseCase,
    @Inject('RefreshTokenUseCase') private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject('GetCurrentUserUseCase') private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Public()
  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequestDto) {
    const result = await this.loginUseCase.execute(body);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value;
  }

  @Public()
  @Post('signup')
  async signup(@Body(new ZodValidationPipe(SignupRequestSchema)) body: SignupRequestDto) {
    const result = await this.signupUseCase.execute(body);
    if (!result.ok) throw new ConflictException(result.error.message);
    return result.value;
  }

  @Public()
  @Post('refresh')
  async refresh(@Body(new ZodValidationPipe(RefreshTokenRequestSchema)) body: RefreshTokenRequestDto) {
    const result = await this.refreshTokenUseCase.execute(body.refreshToken);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value;
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const result = await this.getCurrentUserUseCase.execute(user._id);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value;
  }
}
