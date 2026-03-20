import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { ConnectSessionSchema } from './dto/session-connect.dto';
import type { ConnectSessionDto } from './dto/session-connect.dto';
import { AcceptSessionParamsSchema } from './dto/sessionid-accept.dto';
import { RateSessionParamsSchema } from './dto/sessionid-rate.dto';
import { RateSessionBodySchema } from './dto/sessionid-rate.dto';
import type { RateSessionBodyDto } from './dto/sessionid-rate.dto';
import { SessionHistoryQuerySchema } from './dto/sessionhistory.dto';
import type { SessionHistoryQueryDto } from './dto/sessionhistory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type ValidatedUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS A CONTROLLER?
//
// The Controller is the "front door" of your feature. Its ONLY job is to:
//   1. Declare which HTTP route this handles (e.g. POST /session/connect)
//   2. Extract data from the incoming request (body, params, the logged-in user)
//   3. Hand that data to the Service and wait for a result
//   4. Return the result as an HTTP response
//
// Controllers should contain ZERO business logic. No DB calls, no Redis,
// no if/else decisions. All of that lives in the Service.
// ─────────────────────────────────────────────────────────────────────────────

@Controller('session')
// @UseGuards(AuthGuard, RolesGuard) applies to ALL routes in this controller.
// AuthGuard verifies the JWT Bearer token in the Authorization header.
// If the token is missing or invalid, the request is rejected with 401
// before it even reaches your method.
// RolesGuard checks the `roles[]` claim inside the JWT against @Roles().
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionController {
  // NestJS "injects" SessionService here automatically (Dependency Injection).
  // You never call `new SessionService()` yourself — NestJS manages that.
  // This means SessionController always has a ready-to-use service instance.
  constructor(private readonly sessionService: SessionService) {}

  // ─── POST /session/connect ──────────────────────────────────────────────

  @Post('connect')
  @Roles('user')
  @HttpCode(HttpStatus.OK)
  async connect(
    @CurrentUser() user: ValidatedUser,
    @Body(new ZodValidationPipe(ConnectSessionSchema)) dto: ConnectSessionDto,
  ) {
    return this.sessionService.connect(user.accountId, dto);
  }

  // ─── POST /session/:sessionId/accept ───────────────────────────────────
  //
  // WHAT THIS ROUTE DOES:
  // A volunteer received a push notification saying "a seeker needs help".
  // They tap "Accept" in the app. The app calls this endpoint.
  //
  // The key challenge: multiple volunteers may have received the SAME push
  // notification and all tap Accept at nearly the same time.
  // Only ONE should win — the first to arrive. The rest get 409.
  // This race is resolved atomically in the service using Redis HSETNX.

  @Post(':sessionId/accept')
  // Only volunteers can accept sessions. Seekers get 403.
  @Roles('volunteer')
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: ValidatedUser,

    // @Param() extracts the :sessionId from the URL path.
    // ZodValidationPipe validates it is a proper UUID before anything runs.
    @Param(new ZodValidationPipe(AcceptSessionParamsSchema))
    params: { sessionId: string },
  ) {
    return this.sessionService.accept(params.sessionId, user.accountId);
  }

  // ─── PATCH /session/:sessionId/rate ────────────────────────────────────
  //
  // WHAT THIS ROUTE DOES:
  // After a session ends, both the seeker AND the volunteer can each rate it
  // once. The service figures out who is calling from their JWT roles and
  // writes to the correct column in chat_session.
  //
  // Note: @Patch() is used instead of @Post() because we are partially
  // UPDATING an existing resource (the chat_session row), not creating one.

  @Patch(':sessionId/rate')
  @Roles('user', 'volunteer')
  @HttpCode(HttpStatus.OK)
  async rate(
    @CurrentUser() user: ValidatedUser,
    @Param(new ZodValidationPipe(RateSessionParamsSchema))
    params: { sessionId: string },
    @Body(new ZodValidationPipe(RateSessionBodySchema)) dto: RateSessionBodyDto,
  ) {
    return this.sessionService.rate(
      params.sessionId,
      user.accountId,
      user.roles,
      dto,
    );
  }

  // ─── GET /session/history ──────────────────────────────────────────────
  //
  // WHAT THIS ROUTE DOES:
  // Returns the calling user's past sessions, paginated.
  // Works for BOTH seekers and volunteers — the service uses their ID
  // to find sessions where they were either the seeker or the listener.
  //
  // IMPORTANT — route ordering:
  // This route is declared as 'history' (a fixed string).
  // The accept route above is ':sessionId' (a dynamic param).
  // NestJS matches routes TOP TO BOTTOM. 'history' must be declared
  // BEFORE ':sessionId' routes, otherwise NestJS would treat the
  // word "history" as a sessionId and hit the wrong handler.
  // Since we have GET here vs POST/PATCH above, there's no conflict —
  // but it's good habit to always put fixed routes before dynamic ones.

  @Get('history')
  @Roles('user', 'volunteer')
  async history(
    @CurrentUser() user: ValidatedUser,

    // @Query() extracts URL query parameters (?page=1&limit=20).
    // ZodValidationPipe validates and coerces them from strings to numbers.
    @Query(new ZodValidationPipe(SessionHistoryQuerySchema))
    query: SessionHistoryQueryDto,
  ) {
    return this.sessionService.getHistory(user.accountId, query);
  }

  // ─── GET /session/tickets ──────────────────────────────────────────────
  //
  // WHAT THIS ROUTE DOES:
  // Returns how many session tickets the seeker has left today.
  // The app shows this so the seeker knows before even trying to connect
  // whether they'll be allowed to start a new session.
  //
  // Data comes entirely from Redis — no DB query needed at all.
  // The ticket state lives in `ticket:{accountId}:{YYYY-MM-DD}` hash.
  //
  // Route ordering note: 'tickets' is another fixed string route, so it
  // must stay above any ':sessionId' dynamic routes — same reason as 'history'.

  @Get('tickets')
  // Only seekers have ticket limits. Volunteers are not restricted.
  @Roles('user')
  async tickets(@CurrentUser() user: ValidatedUser) {
    return this.sessionService.getTickets(user.accountId);
  }
}