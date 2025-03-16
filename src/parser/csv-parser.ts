import * as fs from 'fs';
import * as csv from 'csv-parser';
import { Transaction } from './pdf-parser';

export class CsvParser {
  async parseTransactions(csvFilePath: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(csvFilePath)) {
        reject(new Error(`File not found: ${csvFilePath}`));
        return;
      }
      
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

  processRow(row: any): Transaction | null {
    // Skip header rows or empty rows
    if (!row['Description'] || row['Description'].includes('Card Number')) {
      return null;
    }

    // Extract and clean description
    let description = row['Description'] || '';
    
    // Extract amount
    let amount = parseFloat(row['Amount'] || '0');
    if (isNaN(amount)) {
      const amountMatch = description.match(/([0-9,.]+)(?:CR)?$/);
      if (amountMatch) {
        const extractedAmount = amountMatch[1].replace(/,/g, '');
        amount = parseFloat(extractedAmount);
        description = description.replace(amountMatch[0], '').trim();
      }
    }
    
    // Determine if credit or debit
    let type: 'credit' | 'debit' = 'debit';
    if (description.includes('CR') || description.includes('RECEIVED') || amount > 0) {
      type = 'credit';
      amount = Math.abs(amount);
    } else {
      amount = Math.abs(amount) * -1; // Ensure debit is negative
    }
    
    // Get transaction date and posting date
    const transactionDate = row['Transaction Date'] || '';
    const postingDate = row['Posting Date'] || '';
    
    // Clean up description
    description = description.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}/, '').trim();
    
    return {
      transactionDate,
      postingDate,
      description,
      amount,
      type
    };
  }
}
