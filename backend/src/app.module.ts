import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { ExportsModule } from './exports/exports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGODB_URI',
          'mongodb+srv://geerthiganeonlabz_db_user:yXX3tzxDYEaRur4i@cluster0.lgp9ckv.mongodb.net/?appName=Cluster0',
        ),
      }),
    }),
    AuthModule,
    UsersModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    SettingsModule,
    ExportsModule,
  ],
})
export class AppModule {}
