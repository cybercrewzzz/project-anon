import { Module } from '@nestjs/common';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKS MODULE
//
// Provides the block/unblock/list endpoints (POST, DELETE, GET /block).
// PrismaModule is global (registered in AppModule) so we don't import it here.
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
