import * as fs from 'fs';
import pdfParse from 'pdf-parse';

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
    
    // Split into lines
    const lines = sectionText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    
    
    // Process lines to combine multi-line transactions
    const processedLines: string[] = [];
    
    
    for(let i=0; i< lines.length; i++) {
      const line = lines[i];
      // If this is a new transaction (starts with date)
      if (this.isTxnLine(line)) {
        // This is a potential line that has a transction
        let currentLine = line;  
        // if (this.isForeignTxnLine(currentLine)) {
        while(!this.doesLineEndWithAmount(currentLine)){
          currentLine = currentLine + ' ' + lines[i+1];
          i++;
        }
        // }
        processedLines.push(currentLine)
      }
  }
    
  
    
    return processedLines;
}

  private isTxnLine(line:string ){
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}/;
    return dateRegex.test(line.substring(0, 10));
  }

  private isForeignTxnLine(line:string ){
    return line.includes(' USD') || line.includes(' EUR') || line.includes(' GBP')
  }

  private doesLineEndWithAmount(line: string): boolean {
    // Find the last space-separated component in the line
    const lineComponents = line.split(' ');
    const lastComponent = lineComponents[lineComponents.length - 1];
    
    // Make sure we're handling strings like "4,501.56" or just "501.56"
    // Remove any commas to properly parse numbers like "4,501.56"
    const cleanedNumber = lastComponent.replace(/,/g, '');
    
    // Check if this is a valid number using regex to avoid parsing values like "0.211)"
    const isValidNumber = /^-?\d+(\.\d+)?$/.test(cleanedNumber);
    
    // Return true only if this is a properly formatted number
    return isValidNumber;
  }

  private parseTransactionLine(line: string): Transaction | null {
    if (!line || line.length < 20) return null;

    // Extract dates
    const transactionDate = line.substring(0, 10);
    const postingDate = line.substring(10, 20);
    
    // Remove both dates from the start (20 characters)
    const remaining = line.substring(20).trim();
    
    // Handle the case where there might be a final amount at the end (for foreign transactions)
    const amountMatch = remaining.match(/\s+(\d+\.\d+)$/);
    let amount: number;
    
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      // Remove the amount from the end to get description
      const description = remaining.substring(0, remaining.length - amountMatch[0].length).trim();
      
      return {
        transactionDate,
        postingDate,
        description,
        amount,
        type: amount < 0 ? 'debit' : 'credit'
      };
    } else {
      // Original logic for simple transactions
      const parts = remaining.split(/\s+/);
      amount = parseFloat(parts[parts.length - 1].replace(/,/g, ''));
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
}
