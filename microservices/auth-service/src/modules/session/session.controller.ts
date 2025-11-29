import { Controller, Get, Delete, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionService } from './session.service';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get all sessions for a user' })
  @ApiBearerAuth()
  async getUserSessions(@Param('userId') userId: string) {
    return this.sessionService.getUserSessions(userId);
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Revoke a session' })
  @ApiBearerAuth()
  async revokeSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.revokeSession(sessionId);
  }
}

