import * as fs from 'fs';
const pdfParse = require('pdf-parse');

export interface Transaction {
  transactionDate: string;
  postingDate: string;
  description: string;
  amount: number;
  type?: 'credit' | 'debit';
}

export class PdfParser {
  async parseTransactions(pdfPath: string): Promise<Transaction[]> {
    try {
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`File not found: ${pdfPath}`);
      }
      
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      const transactions: Transaction[] = [];
      const text = pdfData.text;
      
      const transactionSection = this.extractTransactionSection(text);
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}/;
      const lines = transactionSection.split('\n')
        .filter(line => line.trim().length > 0)
        .filter(line => dateRegex.test(line.substring(0, 10)));
      
      for (let i = 0; i < lines.length; i++) {
        const transaction = this.parseTransactionLine(lines[i]);
        if (transaction) {
          transactions.push(transaction);
          if (transaction.description && transaction.description.includes('\n')) {
            i++;
          }
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw error;
    }
  }

  private extractTransactionSection(text: string): string {
    const startMarker = 'Transaction Date,Description,Date,Amount';
    const startIndex = text.indexOf(startMarker);
    
    const endMarker = 'STATEMENT SUMMARY (AED)';
    const endIndex = text.indexOf(endMarker, startIndex);
    
    return startIndex !== -1 ? text.substring(startIndex, endIndex !== -1 ? endIndex : undefined) : text;
  }

  private parseTransactionLine(line: string): Transaction | null {
    if (!line || line.length < 16) return null;

    // Extract dates - first 8 chars for transaction date, next 8 for posting date
    const transactionDate = line.substring(0, 10);
    const postingDate = line.substring(10, 20);
    
    // Remove both dates from the start (16 characters)
    let remaining = line.substring(20).trim();
    
    // Split by spaces and get the last element as amount
    const parts = remaining.split(/\s+/);
    const amount = parseFloat(parts[parts.length - 1].replace(/,/g, ''));
    
    // Remove the amount from the end to get description
    const description = parts.slice(0, parts.length - 1).join(' ').trim();

    return {
      transactionDate: transactionDate,
      postingDate: postingDate,
      description,
      amount,
      type: amount < 0 ? 'debit' : 'credit'
    };
  }
}
