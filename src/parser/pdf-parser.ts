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
      return this.parseTransactionsFromBuffer(dataBuffer);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw error;
    }
  }
  
  async parseTransactionsFromBuffer(dataBuffer: Buffer): Promise<Transaction[]> {
    try {
      const pdfData = await pdfParse(dataBuffer);
      return this.parseTransactionsFromText(pdfData.text);
    } catch (error) {
      console.error('Error parsing PDF buffer:', error);
      throw error;
    }
  }
  
  parseTransactionsFromText(text: string): Transaction[] {
    const transactions: Transaction[] = [];
    
    const transactionLines = this.extractTransactionSection(text);
    
    for (let i = 0; i < transactionLines.length; i++) {
      const transaction = this.parseTransactionLine(transactionLines[i]);
      if (transaction) {
        transactions.push(transaction);
        if (transaction.description && transaction.description.includes('\n')) {
          i++;
        }
      }
    }
    
    return transactions;
  }

  private extractTransactionSection(text: string): string[] {
    const startMarker = 'Transaction Date,Description,Date,Amount';
    const startIndex = text.indexOf(startMarker);
    
    const endMarker = 'STATEMENT SUMMARY (AED)';
    const endIndex = text.indexOf(endMarker, startIndex);
    
    const sectionText = startIndex !== -1 ? text.substring(startIndex, endIndex !== -1 ? endIndex : undefined) : text;
    
    // Filter for date format and non-empty lines
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}/;
    return sectionText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => dateRegex.test(line.substring(0, 10)));
  }

  private parseTransactionLine(line: string): Transaction | null {
    if (!line || line.length < 20) return null;

    // Extract dates
    const transactionDate = line.substring(0, 10);
    const postingDate = line.substring(10, 20);
    
    // Remove both dates from the start (20 characters)
    let remaining = line.substring(20).trim();
    
    // Split by spaces and get the last element as amount
    const parts = remaining.split(/\s+/);
    const amount = parseFloat(parts[parts.length - 1].replace(/,/g, ''));
    
    // Remove the amount from the end to get description
    const description = parts.slice(0, parts.length - 1).join(' ').trim();

    return {
      transactionDate,
      postingDate,
      description,
      amount,
      type: amount < 0 ? 'debit' : 'credit'
    };
  }
}
