import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RequestModule } from './Requests/requests.module';
import { Settings } from './Settings/settings.entity';
import { SettingsModule } from './Settings/settings.module';
import { ProfileModule } from './Profile/profile.module';
import { Profile } from './Profile/profile.entity';
import { AuthModule } from './Auth/auth.module';
import { Resource } from './resources/resources.entity';
import { School } from './school/school.entity';
import { Category } from './categories/categories.entity';
import { Upload } from './uploads/uploads.entity';
import { SupabaseService } from './supabase/supabase.service';
import { SupabaseModule } from './supabase/supabase.module';
import { Quiz } from './quizzes/quizzes.entity';
import { SchoolModule } from './school/school.module';
import { ResourcesModule } from './resources/resources.module';
import { CategoriesModule } from './categories/categories.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { UploadsModule } from './uploads/uploads.module';
import { PaymentModule } from './payment/payment.module';
import { SchoolClass } from './classes/classes.entity';
import { ClassesModule } from './classes/classes.module';
import { UserActivity } from './activity/user-activity.entity';
import { ActivityModule } from './activity/activity.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, 
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [Request, Settings, Profile, Resource, School, Category, Upload, Quiz, SchoolClass, UserActivity],
      autoLoadEntities: true,
      synchronize: true,
      extra: {
        max: 10,          // max connections in pool
        idleTimeoutMillis: 30000,
      },
    }),
    RequestModule,
    SettingsModule,
    ProfileModule,
    AuthModule,
    SupabaseModule,
    SchoolModule,
    ResourcesModule,
    CategoriesModule,
    QuizzesModule,
    UploadsModule,
    PaymentModule,
    ClassesModule,
    ActivityModule,
    StorageModule
  ],
  controllers: [],
  providers: [SupabaseService],
})
export class AppModule {}