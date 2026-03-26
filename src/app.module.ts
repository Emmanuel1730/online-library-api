import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RequestModule } from './Requests/requests.module';
import { Settings } from './Settings/settings.entity';
import { SettingsModule } from './Settings/settings.module';
import { ProfileModule } from './Profile/profile.module';
import { Profile } from './Profile/profile.entity';
import { AuthModule } from './Auth/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [Request, Settings, Profile], //Reg entities
      autoLoadEntities: true,
      synchronize: true,
    }),
    RequestModule,
    SettingsModule,
    ProfileModule,
    AuthModule,
  ],
  controllers: [],
  providers: [FirebaseService],
})
export class AppModule {}
