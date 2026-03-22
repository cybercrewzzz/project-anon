import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { MatchingService } from './matching.service';
import { TicketService } from './ticket.service';

// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS A MODULE?
//
// A NestJS Module is the glue that wires everything together.
// Think of it as a "package declaration" that tells NestJS:
//   - Which CONTROLLERS to expose (handle HTTP routes)
//   - Which PROVIDERS (services) exist in this feature
//   - Which external modules this feature IMPORTS (needs to use)
//   - Which providers to EXPORT (make available to other modules)
//
// NestJS reads this module at startup and sets up the Dependency Injection
// container automatically. You never call `new SomeService()` yourself —
// NestJS instantiates everything and injects it where needed.
//
// MODULE STRUCTURE VISUALISED:
//
//   HTTP Request
//       │
//       ▼
//   SessionController        ← handles route, validates input
//       │
//       ▼
//   SessionService           ← orchestrates the full flow
//       │
//       ├──► MatchingService ← finds the best volunteer
//       ├──► TicketService   ← checks/reserves/consumes daily tickets
//       ├──► PrismaService   ← database queries (from PrismaModule)
//       ├──► RedisService    ← Redis operations (from RedisModule)
//       └──► BullMQ Queues   ← schedules delayed jobs
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  imports: [
    // Register the BullMQ queues that SessionService will produce jobs into.
    // The queue NAMES here must match the strings used in @InjectQueue() in
    // SessionService. The actual workers that PROCESS these jobs also live
    // in this module (you'll add them as providers when you build the workers).
    BullModule.registerQueue(
      { name: 'sessions' }, // for session:grace-end, session:timeout, match:timeout
      { name: 'notifications' }, // for notify:volunteers (processed by Thusirui's worker)
    ),
    // PrismaModule and RedisModule are global modules registered in AppModule.
    // You do NOT need to import them here — they are automatically available
    // everywhere once registered globally in app.module.ts.
  ],

  controllers: [
    // Registers SessionController so NestJS maps POST /session/connect
    // (and future session routes) to this controller.
    SessionController,
  ],

  providers: [
    // All services used within this module must be listed here.
    // NestJS will instantiate them and inject them wherever needed.
    SessionService,
    MatchingService,
    TicketService,
    // Note: SessionController also lives here implicitly through `controllers`,
    // but services must be explicitly in `providers`.
  ],

  exports: [
    // Export SessionService so other modules (e.g. Thusirui's ChatModule)
    // can call session end logic without duplicating code.
    SessionService,
    TicketService,
  ],
})
export class SessionModule {}
