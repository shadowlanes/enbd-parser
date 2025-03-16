import { PdfParser } from '../parser/pdf-parser';
import { CsvGenerator } from '../utils/csv-generator';
import * as path from 'path';

export class ParseCommand {
  private pdfParser = new PdfParser();
  private csvGenerator = new CsvGenerator();
  
  async execute(pdfPath: string, outputPath?: string): Promise<void> {
    try {
      console.log(`Parsing PDF: ${pdfPath}`);
      
      // Get base filename without extension
      const baseFilename = path.basename(pdfPath, path.extname(pdfPath));
      
      // Parse transactions from PDF
      const transactions = await this.pdfParser.parseTransactions(pdfPath);
      console.log(`Found ${transactions.length} transactions`);
      
      // Generate CSV from transactions
      if (transactions.length > 0) {
        const csvPath = await this.csvGenerator.generateCsv(transactions, outputPath, baseFilename);
        console.log(`Successfully generated CSV: ${csvPath}`);
      } else {
        console.log('No transactions found in the PDF.');
      }
    } catch (error) {
      console.error('Error executing parse command:', error);
      process.exit(1);
    }
  }
}
