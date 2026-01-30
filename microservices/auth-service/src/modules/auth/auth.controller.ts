import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ValidateTokenDto, ValidateResponseDto } from './dto/validate-token.dto';

@ApiTags('Authentication')
@Controller('validate')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate access token' })
  @ApiResponse({ status: 200, description: 'Token is valid', type: ValidateResponseDto })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
  async validateToken(@Body() dto: ValidateTokenDto): Promise<ValidateResponseDto> {
    return this.authService.validateToken(dto.token);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async health() {
    return { status: 'ok', service: 'auth-service' };
  }
}

