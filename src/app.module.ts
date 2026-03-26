import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RequestModule } from './Requests/requests.module';
import { Settings } from './Settings/settings.entity';
import { SettingsModule } from './Settings/settings.module';
import { SchoolModule } from './school/school.module';
import { CategoriesModule } from './categories/categories.module';
import { ResourcesModule } from './resources/resources.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { Quiz } from './quizzes/quizzes.entity';
import { Resource } from './resources/resources.entity';
import { School } from './school/school.entity';
import { Category } from './categories/categories.entity';
import { User } from './users/users.entity';
import { FirebaseService } from './firebase/firebase.service';

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
      entities: [Request, Settings, Resource, User, Category, School, Quiz], //Reg entities
      autoLoadEntities: true,
      synchronize: true,
    }),
    RequestModule,
    SettingsModule,
    SchoolModule,
    CategoriesModule,
    ResourcesModule,
    QuizzesModule,
    UploadsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [FirebaseService],
})
export class AppModule {}
