import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { ConnectSessionDto, ConnectSessionSchema } from './dto/connect-session.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtPayload } from '../common/types/jwt-payload.type';

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
@UseGuards(AuthGuard, RolesGuard)
export class SessionController {
  // NestJS "injects" SessionService here automatically (Dependency Injection).
  // You never call `new SessionService()` yourself — NestJS manages that.
  // This means SessionController always has a ready-to-use service instance.
  constructor(private readonly sessionService: SessionService) {}

  // ─── POST /session/connect ──────────────────────────────────────────────

  @Post('connect')
  // Only users with the 'user' (Seeker) role can call this endpoint.
  // If a volunteer tries to call it, they get 403 Forbidden.
  @Roles('user')
  // By default NestJS returns 201 for POST. We override to 200/202 because:
  //   200 = match found immediately
  //   202 = queued, waiting for a volunteer
  // We return the actual status code dynamically from the service using
  // HttpException, so this decorator just sets the "happy path" default.
  @HttpCode(HttpStatus.OK)
  async connect(
    // @CurrentUser() is a custom decorator (from core setup) that reads the
    // decoded JWT payload that AuthGuard already verified and attached to the
    // request. This gives us the logged-in user's ID, email, and roles[]
    // without hitting the database again.
    @CurrentUser() user: JwtPayload,

    // @Body() extracts the JSON request body.
    // ZodValidationPipe runs FIRST — it validates the body against
    // ConnectSessionSchema. If validation fails, it throws a 400 error
    // automatically. If validation passes, `dto` is typed and safe.
    @Body(new ZodValidationPipe(ConnectSessionSchema)) dto: ConnectSessionDto,
  ) {
    // Hand off to the service. The controller just returns whatever the
    // service gives back — NestJS serialises it to JSON automatically.
    return this.sessionService.connect(user.sub, dto);
  }
}