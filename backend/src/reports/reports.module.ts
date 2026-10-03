import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { Budget, BudgetSchema } from '../budgets/schemas/budget.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Budget.name, schema: BudgetSchema },
      { name: Category.name, schema: CategorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
