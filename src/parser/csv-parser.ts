import * as fs from 'fs';
import * as csv from 'csv-parser';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  transactionDate: string;
  type: 'credit' | 'debit';
}

export class CsvParser {
  async parseTransactions(csvFilePath: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      const transactions: Transaction[] = [];
      
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const transaction = this.processRow(row);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            console.warn('Error processing row:', error, row);
          }
        })
        .on('end', () => {
          resolve(transactions);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private processRow(row: any): Transaction | null {
    // Skip header rows or empty rows
    if (!row.Description || row.Description.includes('Card Number')) {
      return null;
    }

    // Extract and clean description
    let description = row.Description || '';
    
    // Extract amount from description if not properly separated
    let amount = parseFloat(row.Amount || '0');
    const amountMatch = description.match(/([0-9,.]+)(?:CR)?$/);
    
    // If amount is in description, extract it and clean description
    if (amountMatch && (!amount || isNaN(amount))) {
      const extractedAmount = amountMatch[1].replace(/,/g, '');
      amount = parseFloat(extractedAmount);
      description = description.replace(amountMatch[0], '').trim();
    }
    
    // Determine if credit or debit
    let type: 'credit' | 'debit' = 'debit';
    if (description.includes('CR') || description.includes('RECEIVED')) {
      type = 'credit';
      // Sometimes amount is negative for credits, make it positive
      amount = Math.abs(amount);
    }
    
    // Extract date from Date column or from description
    let date = row.Date || '';
    if (!date) {
      const dateMatch = description.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (dateMatch) {
        date = dateMatch[0];
      }
    }
    
    // Clean up description
    description = description.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}/, '').trim();
    
    return {
      date,
      description,
      amount,
      transactionDate: row['Transaction Date'] || '',
      type
    };
  }
}
