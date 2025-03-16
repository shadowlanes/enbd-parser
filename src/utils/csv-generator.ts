import { createObjectCsvWriter } from 'csv-writer';
import * as path from 'path';
import * as fs from 'fs';
import { Transaction } from '../parser/pdf-parser';

export class CsvGenerator {
  async generateCsv(transactions: Transaction[], outputPath?: string): Promise<string> {
    try {
      // Generate output path if not provided
      if (!outputPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = path.join(process.cwd(), 'statements', 'parsed');
        
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        outputPath = path.join(outputDir, `transactions-${timestamp}.csv`);
      }
      
      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: [
          { id: 'transactionDate', title: 'Transaction Date' },
          { id: 'postingDate', title: 'Posting Date' },
          { id: 'description', title: 'Description' },
          { id: 'amount', title: 'Amount' }
        ]
      });
      
      // Write transactions to CSV
      await csvWriter.writeRecords(transactions);
      
      console.log(`CSV file has been written to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  }
}
