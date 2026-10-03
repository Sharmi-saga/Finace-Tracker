import * as dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { UserSchema } from './users/schemas/user.schema';
import { AccountSchema } from './accounts/schemas/account.schema';
import { CategorySchema } from './categories/schemas/category.schema';
import { TransactionSchema } from './transactions/schemas/transaction.schema';
import { BudgetSchema } from './budgets/schemas/budget.schema';
import { SettingSchema } from './settings/schemas/setting.schema';

dotenv.config();

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://geerthiganeonlabz_db_user:yXX3tzxDYEaRur4i@cluster0.lgp9ckv.mongodb.net/?appName=Cluster0';

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected successfully.');

  const UserModel = mongoose.model('User', UserSchema);
  const AccountModel = mongoose.model('Account', AccountSchema);
  const CategoryModel = mongoose.model('Category', CategorySchema);
  const TransactionModel = mongoose.model('Transaction', TransactionSchema);
  const BudgetModel = mongoose.model('Budget', BudgetSchema);
  const SettingModel = mongoose.model('Setting', SettingSchema);

  // Clear existing demo data
  const demoEmail = 'demo@financetracker.com';
  const existingUser = await UserModel.findOne({ email: demoEmail });
  if (existingUser) {
    const uId = existingUser._id;
    await AccountModel.deleteMany({ userId: uId });
    await CategoryModel.deleteMany({ userId: uId });
    await TransactionModel.deleteMany({ userId: uId });
    await BudgetModel.deleteMany({ userId: uId });
    await SettingModel.deleteMany({ userId: uId });
    await UserModel.deleteOne({ _id: uId });
    console.log('Cleared previous demo user data.');
  }

  // 1. Create Demo User: A. S. Sharmitha
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await UserModel.create({
    name: 'A. S. Sharmitha',
    email: demoEmail,
    passwordHash,
    role: 'Founder / CEO',
    profileImage: '',
    defaultCurrency: 'LKR',
    dateFormat: 'DD MMM YYYY',
    dashboardStartPage: 'Dashboard',
  });
  console.log(`Created user: ${user.name} (${user.email})`);

  // 2. Settings
  await SettingModel.create({
    userId: user._id,
    dateFormat: 'DD MMM YYYY',
    defaultCurrency: 'LKR',
    dashboardStartPage: 'Dashboard',
  });

  // 3. Categories
  const categoryDefs = [
    { name: 'Food', type: 'Expense', icon: 'Utensils', color: '#F59E0B' },
    { name: 'Business Expenses', type: 'Expense', icon: 'Briefcase', color: '#8B5CF6' },
    { name: 'Bills & Utilities', type: 'Expense', icon: 'Zap', color: '#EC4899' },
    { name: 'Transport', type: 'Expense', icon: 'Car', color: '#3B82F6' },
    { name: 'Materials', type: 'Expense', icon: 'Layers', color: '#6366F1' },
    { name: 'Shopping', type: 'Expense', icon: 'ShoppingBag', color: '#14B8A6' },
    { name: 'Entertainment', type: 'Expense', icon: 'Film', color: '#F97316' },
    { name: 'Health', type: 'Expense', icon: 'Heart', color: '#EF4444' },
    { name: 'Education', type: 'Expense', icon: 'BookOpen', color: '#10B981' },
    { name: 'Salary', type: 'Income', icon: 'CreditCard', color: '#059669' },
    { name: 'Client Payment', type: 'Income', icon: 'DollarSign', color: '#10B981' },
    { name: 'Other', type: 'Expense', icon: 'MoreHorizontal', color: '#6B7280' },
  ];

  const createdCategories: Record<string, any> = {};
  for (const c of categoryDefs) {
    const cat = await CategoryModel.create({
      userId: user._id,
      ...c,
    });
    createdCategories[c.name] = cat;
  }
  console.log(`Created ${Object.keys(createdCategories).length} categories.`);

  // 4. Accounts
  const accountDefs = [
    {
      name: 'Personal',
      type: 'Personal',
      currency: 'LKR',
      description: 'Your personal income and expenses',
      icon: 'User',
      status: 'Active',
    },
    {
      name: 'Company 1',
      type: 'Business',
      currency: 'LKR',
      description: 'Business income and expenses',
      icon: 'Building2',
      status: 'Active',
    },
    {
      name: 'Company 2',
      type: 'Business',
      currency: 'LKR',
      description: 'Corporate consulting and operations',
      icon: 'Briefcase',
      status: 'Active',
    },
    {
      name: 'Company 3',
      type: 'Business',
      currency: 'LKR',
      description: 'E-commerce and overseas ventures',
      icon: 'Store',
      status: 'Active',
    },
  ];

  const createdAccounts: Record<string, any> = {};
  for (const acc of accountDefs) {
    const account = await AccountModel.create({
      userId: user._id,
      ...acc,
    });
    createdAccounts[acc.name] = account;
  }
  console.log(`Created ${Object.keys(createdAccounts).length} accounts.`);

  // 5. September 2026 Transactions
  // Requirements:
  // Income: 425,000 (Personal: 180,000; Company 1: 150,000; Company 2: 95,000)
  // Expenses: 302,500
  //   Personal Expenses: 140,000 (Food: 45,000, Transport: 20,000, Bills: 25,000, Shopping: 28,000, Entertainment: 10,000, Health: 12,000)
  //   Company Expenses: 162,500 (Business Expenses: 54,450, Food/Team lunch: 21,550 [total Food: 66,550], Materials: 42,000, Bills: 23,000 [total Bills: 48,000], Transport: 15,500 [total Transport: 35,500], Entertainment: 6,000 [total Ent: 16,000])
  // Total Expenses = 140,000 + 162,500 = 302,500 LKR!
  // Food: 45,000 + 21,550 = 66,550 (22%)
  // Business Expenses: 54,450 (18%)
  // Transfers: 50,000 (Personal to Company 1)

  const sept2026Tx = [
    // Income
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Income',
      categoryId: createdCategories['Salary']._id,
      amount: 180000,
      description: 'Monthly Executive Salary',
      date: new Date('2026-09-01T09:00:00Z'),
      notes: 'Direct deposit into Personal account',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Income',
      categoryId: createdCategories['Client Payment']._id,
      amount: 150000,
      description: 'Client Payment - Project Phoenix Milestone 2',
      date: new Date('2026-09-08T11:30:00Z'),
      notes: 'Wire transfer received',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 2']._id,
      type: 'Income',
      categoryId: createdCategories['Client Payment']._id,
      amount: 95000,
      description: 'Client Monthly Retainer',
      date: new Date('2026-09-14T14:15:00Z'),
      notes: 'Consulting retainer fee',
    },

    // Transfers
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      transferToAccountId: createdAccounts['Company 1']._id,
      type: 'Transfer',
      amount: 50000,
      description: 'Capital Injection to Company 1',
      date: new Date('2026-09-10T16:00:00Z'),
      notes: 'Working capital funding',
    },

    // Personal Expenses (Sum = 140,000)
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Food']._id,
      amount: 45000,
      description: 'Monthly Grocery & Fresh Produce',
      date: new Date('2026-09-04T12:00:00Z'),
      notes: 'Supermarket supplies',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Bills & Utilities']._id,
      amount: 25000,
      description: 'Home Electricity & Fiber Internet',
      date: new Date('2026-09-06T10:00:00Z'),
      notes: 'Monthly utility bills',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Transport']._id,
      amount: 20000,
      description: 'Fuel & City Transport',
      date: new Date('2026-09-11T17:30:00Z'),
      notes: 'Vehicle fuel and toll passes',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Shopping']._id,
      amount: 28000,
      description: 'Work Wardrobe & Home Essentials',
      date: new Date('2026-09-15T15:20:00Z'),
      notes: 'Seasonal apparel',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Entertainment']._id,
      amount: 10000,
      description: 'Weekend Dining & Streaming Subscriptions',
      date: new Date('2026-09-18T20:00:00Z'),
      notes: 'Leisure and movies',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Health']._id,
      amount: 12000,
      description: 'Wellness Checkup & Fitness Membership',
      date: new Date('2026-09-20T08:30:00Z'),
      notes: 'Gym and routine health',
    },

    // Company Expenses (Sum = 162,500)
    {
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Expense',
      categoryId: createdCategories['Business Expenses']._id,
      amount: 54450,
      description: 'Cloud Infrastructure & SaaS Software',
      date: new Date('2026-09-07T13:00:00Z'),
      notes: 'AWS & Figma enterprise licenses',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Expense',
      categoryId: createdCategories['Food']._id,
      amount: 21550,
      description: 'Team lunch & Client Refreshments',
      date: new Date('2026-09-22T13:45:00Z'),
      notes: 'Quarterly milestone lunch with engineering team',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Expense',
      categoryId: createdCategories['Materials']._id,
      amount: 42000,
      description: 'Office Hardware & Development Kits',
      date: new Date('2026-09-16T11:00:00Z'),
      notes: 'Monitors and peripherals for team',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Expense',
      categoryId: createdCategories['Bills & Utilities']._id,
      amount: 23000,
      description: 'Workspace Utilities & Maintenance',
      date: new Date('2026-09-19T14:00:00Z'),
      notes: 'Co-working office space share',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 2']._id,
      type: 'Expense',
      categoryId: createdCategories['Transport']._id,
      amount: 15500,
      description: 'Client Site Visits & Rideshare',
      date: new Date('2026-09-21T16:00:00Z'),
      notes: 'Meeting transportation',
    },
    {
      userId: user._id,
      accountId: createdAccounts['Company 2']._id,
      type: 'Expense',
      categoryId: createdCategories['Entertainment']._id,
      amount: 6000,
      description: 'Business Networking Event Dinner',
      date: new Date('2026-09-24T19:30:00Z'),
      notes: 'Industry meetup tickets and hospitality',
    },
  ];

  await TransactionModel.insertMany(sept2026Tx);
  console.log(`Created ${sept2026Tx.length} September 2026 transactions.`);

  // 6. Additional Historical Transactions for Jan - Aug 2026
  const pastMonths = [
    { name: 'January', month: 0, inc: 380000, exp: 270000 },
    { name: 'February', month: 1, inc: 395000, exp: 285000 },
    { name: 'March', month: 2, inc: 410000, exp: 290000 },
    { name: 'April', month: 3, inc: 400000, exp: 310000 },
    { name: 'May', month: 4, inc: 430000, exp: 295000 },
    { name: 'June', month: 5, inc: 415000, exp: 305000 },
    { name: 'July', month: 6, inc: 420000, exp: 298000 },
    { name: 'August', month: 7, inc: 440000, exp: 315000 },
    { name: 'October', month: 9, inc: 445000, exp: 320000 },
    { name: 'November', month: 10, inc: 455000, exp: 325000 },
    { name: 'December', month: 11, inc: 480000, exp: 340000 },
  ];

  const historicalTx: any[] = [];
  for (const m of pastMonths) {
    // Income
    historicalTx.push({
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Income',
      categoryId: createdCategories['Salary']._id,
      amount: 175000,
      description: `${m.name} Executive Salary`,
      date: new Date(2026, m.month, 2),
    });
    historicalTx.push({
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Income',
      categoryId: createdCategories['Client Payment']._id,
      amount: m.inc - 175000,
      description: `${m.name} Client Project Revenue`,
      date: new Date(2026, m.month, 10),
    });

    // Expenses
    historicalTx.push({
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Food']._id,
      amount: Math.round(m.exp * 0.22),
      description: `${m.name} Grocery and Meals`,
      date: new Date(2026, m.month, 5),
    });
    historicalTx.push({
      userId: user._id,
      accountId: createdAccounts['Company 1']._id,
      type: 'Expense',
      categoryId: createdCategories['Business Expenses']._id,
      amount: Math.round(m.exp * 0.25),
      description: `${m.name} Operational Costs`,
      date: new Date(2026, m.month, 12),
    });
    historicalTx.push({
      userId: user._id,
      accountId: createdAccounts['Personal']._id,
      type: 'Expense',
      categoryId: createdCategories['Bills & Utilities']._id,
      amount: Math.round(m.exp * 0.2),
      description: `${m.name} Utilities`,
      date: new Date(2026, m.month, 18),
    });
    historicalTx.push({
      userId: user._id,
      accountId: createdAccounts['Company 2']._id,
      type: 'Expense',
      categoryId: createdCategories['Materials']._id,
      amount: m.exp - Math.round(m.exp * 0.22) - Math.round(m.exp * 0.25) - Math.round(m.exp * 0.2),
      description: `${m.name} Equipment and Supplies`,
      date: new Date(2026, m.month, 24),
    });
  }

  await TransactionModel.insertMany(historicalTx);
  console.log(`Created ${historicalTx.length} demo transactions for January-August and October-December 2026.`);

  // 7. Budgets for September 2026
  // Total Budget = 500,000
  // Account budgets:
  // Personal: 180,000 (spent 140,000 -> 78% on track)
  // Company 1: 200,000 (spent 141,000 -> 71% on track)
  // Company 2: 70,000 (spent 21,500 -> 31% on track)
  // Company 3: 50,000 (spent 0 -> 0% not started)
  // Sum = 500,000 LKR!
  const accountBudgets = [
    {
      userId: user._id,
      type: 'Account',
      accountId: createdAccounts['Personal']._id,
      period: 'September 2026',
      amount: 180000,
      notes: 'Monthly personal expenditure ceiling',
      alertEnabled: true,
      alertThreshold: 80,
    },
    {
      userId: user._id,
      type: 'Account',
      accountId: createdAccounts['Company 1']._id,
      period: 'September 2026',
      amount: 200000,
      notes: 'Operations and team budget',
      alertEnabled: true,
      alertThreshold: 80,
    },
    {
      userId: user._id,
      type: 'Account',
      accountId: createdAccounts['Company 2']._id,
      period: 'September 2026',
      amount: 70000,
      notes: 'Consulting logistics budget',
      alertEnabled: true,
      alertThreshold: 80,
    },
    {
      userId: user._id,
      type: 'Account',
      accountId: createdAccounts['Company 3']._id,
      period: 'September 2026',
      amount: 50000,
      notes: 'Venture exploration budget',
      alertEnabled: true,
      alertThreshold: 80,
    },
  ];

  // Category Budgets:
  const categoryBudgets = [
    {
      userId: user._id,
      type: 'Category',
      categoryId: createdCategories['Food']._id,
      period: 'September 2026',
      amount: 80000,
      notes: 'Dining and grocery monthly limit',
      alertEnabled: true,
      alertThreshold: 80,
    },
    {
      userId: user._id,
      type: 'Category',
      categoryId: createdCategories['Business Expenses']._id,
      period: 'September 2026',
      amount: 70000,
      notes: 'Cloud services and licensing',
      alertEnabled: true,
      alertThreshold: 80,
    },
    {
      userId: user._id,
      type: 'Category',
      categoryId: createdCategories['Bills & Utilities']._id,
      period: 'September 2026',
      amount: 60000,
      notes: 'Power, water, and connectivity',
      alertEnabled: true,
      alertThreshold: 80,
    },
    {
      userId: user._id,
      type: 'Category',
      categoryId: createdCategories['Transport']._id,
      period: 'September 2026',
      amount: 45000,
      notes: 'Commute and fuel allowance',
      alertEnabled: true,
      alertThreshold: 80,
    },
  ];

  await BudgetModel.insertMany([...accountBudgets, ...categoryBudgets]);
  console.log(`Created ${accountBudgets.length + categoryBudgets.length} budgets.`);

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
