import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { ReportsService } from '../reports/reports.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class ExportsService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async generatePdf(userId: string, query: { month?: string; accountId?: string; startDate?: string; endDate?: string }): Promise<Buffer> {
    const period = query.month || 'September 2026';
    const summary = await this.reportsService.getSummary(userId, {
      month: period,
      accountId: query.accountId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    const breakdown = await this.reportsService.getExpenseBreakdown(userId, {
      month: period,
      accountId: query.accountId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    const accounts = await this.reportsService.getAccountSummary(userId, {
      month: period,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    const selectedYear = query.startDate ? new Date(query.startDate).getFullYear() : new Date().getFullYear();
    const monthly = await this.reportsService.getMonthlySummary(userId, String(selectedYear));

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Brand Header
      doc.fillColor('#7C3AED').fontSize(22).text('Finance Tracker', 40, 40);
      doc.fillColor('#6B7280').fontSize(10).text('Plan. Track. Grow.', 40, 68);
      doc.fillColor('#111827').fontSize(14).text(`Financial Performance Report - ${period}`, 40, 90);
      doc.moveDown(1.5);

      // Motivational Quote
      doc.fillColor('#4B5563').fontSize(10).font('Helvetica-Oblique').text('"Discipline today. A bigger tomorrow."', 40, 115);
      doc.font('Helvetica');

      // Key Metrics Box
      doc.rect(40, 135, 515, 70).fillAndStroke('#F5F3FF', '#DDD6FE');
      doc.fillColor('#5B21B6').fontSize(11).text('SUMMARY METRICS', 55, 145);
      
      doc.fillColor('#374151').fontSize(10)
        .text(`Total Income: LKR ${summary.totalIncome.toLocaleString()}`, 55, 165)
        .text(`Total Expenses: LKR ${summary.totalExpenses.toLocaleString()}`, 200, 165)
        .text(`Net Remaining: LKR ${summary.netRemaining.toLocaleString()}`, 360, 165);

      doc.text(`Average Spend / Day: LKR ${summary.averageSpend.toLocaleString()}`, 55, 185)
        .text(`Monthly Target: LKR ${summary.monthlyTarget.toLocaleString()}`, 200, 185)
        .text(`Target Achieved: ${summary.targetAchieved}%`, 360, 185);

      // Expense Breakdown by Category
      let currentY = 225;
      doc.fillColor('#1F2937').fontSize(13).text('Expense Breakdown by Category', 40, currentY);
      currentY += 20;

      // Table Header
      doc.rect(40, currentY, 515, 20).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(9)
        .text('Category', 50, currentY + 5)
        .text('Transactions', 220, currentY + 5)
        .text('Percentage', 340, currentY + 5)
        .text('Amount (LKR)', 440, currentY + 5);
      currentY += 20;

      breakdown.breakdown.forEach((item) => {
        doc.fillColor('#374151').fontSize(9)
          .text(item.categoryName, 50, currentY + 4)
          .text(String(item.count), 220, currentY + 4)
          .text(`${item.percentage}%`, 340, currentY + 4)
          .text(`LKR ${item.amount.toLocaleString()}`, 440, currentY + 4);
        currentY += 18;
      });

      // Account Summary
      currentY += 15;
      doc.fillColor('#1F2937').fontSize(13).text('Account Performance Summary', 40, currentY);
      currentY += 20;

      doc.rect(40, currentY, 515, 20).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(9)
        .text('Account Name', 50, currentY + 5)
        .text('Type', 180, currentY + 5)
        .text('Income', 270, currentY + 5)
        .text('Expenses', 360, currentY + 5)
        .text('Net Balance', 450, currentY + 5);
      currentY += 20;

      accounts.forEach((acc) => {
        doc.fillColor('#374151').fontSize(9)
          .text(acc.name, 50, currentY + 4)
          .text(acc.type, 180, currentY + 4)
          .text(`LKR ${acc.income.toLocaleString()}`, 270, currentY + 4)
          .text(`LKR ${acc.expenses.toLocaleString()}`, 360, currentY + 4)
          .text(`LKR ${acc.netRemaining.toLocaleString()}`, 450, currentY + 4);
        currentY += 18;
      });

      // Monthly Summary
      currentY += 15;
      if (currentY > 680) {
        doc.addPage();
        currentY = 40;
      }

      doc.fillColor('#1F2937').fontSize(13).text(`${new Date().getFullYear()} Monthly Summary`, 40, currentY);
      currentY += 20;

      doc.rect(40, currentY, 515, 20).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(9)
        .text('Month', 50, currentY + 5)
        .text('Income (LKR)', 160, currentY + 5)
        .text('Expenses (LKR)', 260, currentY + 5)
        .text('Net Remaining', 360, currentY + 5)
        .text('Budget Used', 460, currentY + 5);
      currentY += 20;

      monthly.forEach((m) => {
        if (currentY > 760) {
          doc.addPage();
          currentY = 40;
        }
        doc.fillColor('#374151').fontSize(8.5)
          .text(m.month, 50, currentY + 4)
          .text(m.income.toLocaleString(), 160, currentY + 4)
          .text(m.expenses.toLocaleString(), 260, currentY + 4)
          .text(m.netRemaining.toLocaleString(), 360, currentY + 4)
          .text(m.budgetUsed, 460, currentY + 4);
        currentY += 16;
      });

      doc.end();
    });
  }

  async generateExcel(userId: string, query: { month?: string; accountId?: string; startDate?: string; endDate?: string }): Promise<Buffer> {
    const period = query.month || 'September 2026';
    const summary = await this.reportsService.getSummary(userId, {
      month: period,
      accountId: query.accountId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    const breakdown = await this.reportsService.getExpenseBreakdown(userId, {
      month: period,
      accountId: query.accountId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    const accounts = await this.reportsService.getAccountSummary(userId, {
      month: period,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    const selectedYear = query.startDate ? new Date(query.startDate).getFullYear() : new Date().getFullYear();
    const monthly = await this.reportsService.getMonthlySummary(userId, String(selectedYear));
    const transactionsRes = await this.transactionsService.findAll(userId, {
      month: period,
      limit: '1000',
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Finance Tracker';
    workbook.created = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 28 },
      { header: 'Value', key: 'value', width: 24 },
    ];
    summarySheet.addRows([
      { metric: 'Report Period', value: period },
      { metric: 'Total Income', value: summary.totalIncome },
      { metric: 'Total Expenses', value: summary.totalExpenses },
      { metric: 'Net Remaining', value: summary.netRemaining },
      { metric: 'Average Spend Per Day', value: summary.averageSpend },
      { metric: 'Monthly Target', value: summary.monthlyTarget },
      { metric: 'Target Achieved (%)', value: `${summary.targetAchieved}%` },
      { metric: 'Total Transfers', value: summary.totalTransfers },
    ]);

    // Sheet 2: Transactions
    const txSheet = workbook.addWorksheet('Transactions');
    txSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 28 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Account', key: 'account', width: 18 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount (LKR)', key: 'amount', width: 16 },
      { header: 'Notes', key: 'notes', width: 25 },
    ];
    transactionsRes.data.forEach((tx: any) => {
      txSheet.addRow({
        date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
        description: tx.description,
        type: tx.type,
        account: tx.accountId?.name || 'N/A',
        category: tx.categoryId?.name || (tx.type === 'Transfer' ? 'Transfer' : 'General'),
        amount: tx.amount,
        notes: tx.notes || '',
      });
    });

    // Sheet 3: Account Summary
    const accSheet = workbook.addWorksheet('Account Summary');
    accSheet.columns = [
      { header: 'Account Name', key: 'name', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Currency', key: 'currency', width: 12 },
      { header: 'Income', key: 'income', width: 16 },
      { header: 'Expenses', key: 'expenses', width: 16 },
      { header: 'Net Remaining', key: 'netRemaining', width: 16 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    accounts.forEach((acc) => accSheet.addRow(acc));

    // Sheet 4: Monthly Summary
    const monthSheet = workbook.addWorksheet('Monthly Summary');
    monthSheet.columns = [
      { header: 'Month', key: 'month', width: 20 },
      { header: 'Income', key: 'income', width: 16 },
      { header: 'Expenses', key: 'expenses', width: 16 },
      { header: 'Net Remaining', key: 'netRemaining', width: 16 },
      { header: 'Budget Used', key: 'budgetUsed', width: 14 },
    ];
    monthly.forEach((m) => monthSheet.addRow(m));

    // Sheet 5: Expense Breakdown
    const expSheet = workbook.addWorksheet('Expense Breakdown');
    expSheet.columns = [
      { header: 'Category', key: 'categoryName', width: 24 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Amount (LKR)', key: 'amount', width: 18 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    breakdown.breakdown.forEach((b) => {
      expSheet.addRow({
        categoryName: b.categoryName,
        count: b.count,
        amount: b.amount,
        percentage: `${b.percentage}%`,
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
