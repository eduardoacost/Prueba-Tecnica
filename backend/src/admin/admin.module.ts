import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminLiveController } from './admin-live.controller';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AdminController, AdminLiveController],
  providers: [AdminService],
})
export class AdminModule {}