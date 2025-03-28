import { PdfParser } from '../../src/parser/pdf-parser';

describe('PdfParser', () => {
  let parser: PdfParser;

  beforeEach(() => {
    parser = new PdfParser();
  });

  describe('parseTransactionsFromText', () => {
    it('should parse transactions correctly from valid text', () => {
      const sampleText = `
        Some header information
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        05/01/202306/01/2023 Salary                      1000.00
        10/01/202311/01/2023 Grocery Store               -150.75
        STATEMENT SUMMARY (AED)
        Some footer information
      `;

      const result = parser.parseTransactionsFromText(sampleText);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        {
          transactionDate: '01/01/2023',
          postingDate: '02/01/2023',
          description: 'Coffee Shop',
          amount: -25.50,
          type: 'debit'
        },
        {
          transactionDate: '05/01/2023',
          postingDate: '06/01/2023',
          description: 'Salary',
          amount: 1000.00,
          type: 'credit'
        },
        {
          transactionDate: '10/01/2023',
          postingDate: '11/01/2023',
          description: 'Grocery Store',
          amount: -150.75,
          type: 'debit'
        }
      ]);
    });

    it('should handle empty text properly', () => {
      const result = parser.parseTransactionsFromText('');
      expect(result).toEqual([]);
    });

    it('should handle text without transaction markers', () => {
      const textWithoutMarkers = 'Some random text without proper transaction markers';
      const result = parser.parseTransactionsFromText(textWithoutMarkers);
      expect(result).toEqual([]);
    });

    it('should handle only start marker without end marker', () => {
      const textWithOnlyStartMarker = `
        Some header info
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
      `;
      const result = parser.parseTransactionsFromText(textWithOnlyStartMarker);
      expect(result).toHaveLength(1);
    });

    it('should handle descriptions with multiple words', () => {
      const text = `
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop Downtown Branch   -25.50
        STATEMENT SUMMARY (AED)
      `;
      
      const result = parser.parseTransactionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Coffee Shop Downtown Branch');
      expect(result[0].amount).toBe(-25.50);
    });

    it('should handle transactions with large amounts and commas', () => {
      const text = `
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Salary                      10,000.00
        STATEMENT SUMMARY (AED)
      `;
      
      const result = parser.parseTransactionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(10000.00);
      expect(result[0].type).toBe('credit');
    });

    it('should handle multiple transactions without end marker', () => {
      const text = `
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        05/01/202306/01/2023 Grocery                     -100.75
        10/01/202311/01/2023 Salary                      1500.00
      `;
      
      const result = parser.parseTransactionsFromText(text);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('parseTransactionLine', () => {
    it('should correctly parse a transaction line with debit amount', () => {
      const line = '01/01/202302/01/2023 Coffee Shop                  -25.50';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '01/01/2023',
        postingDate: '02/01/2023',
        description: 'Coffee Shop',
        amount: -25.50,
        type: 'debit'
      });
    });

    it('should correctly parse a transaction line with credit amount', () => {
      const line = '05/01/202306/01/2023 Salary                      1000.00';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '05/01/2023',
        postingDate: '06/01/2023',
        description: 'Salary',
        amount: 1000.00,
        type: 'credit'
      });
    });

    it('should parse transaction line with multiple word description', () => {
      const line = '01/01/202302/01/2023 Coffee Shop Downtown Branch  -25.50';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '01/01/2023',
        postingDate: '02/01/2023',
        description: 'Coffee Shop Downtown Branch',
        amount: -25.50,
        type: 'debit'
      });
    });

    it('should parse transaction line with large amount and commas', () => {
      const line = '05/01/202306/01/2023 Bonus Payment              10,000.00';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '05/01/2023',
        postingDate: '06/01/2023',
        description: 'Bonus Payment',
        amount: 10000.00,
        type: 'credit'
      });
    });

    it('should parse transaction line with special characters in description', () => {
      const line = '01/01/202302/01/2023 Payment-Ref#123              -50.75';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '01/01/2023',
        postingDate: '02/01/2023',
        description: 'Payment-Ref#123',
        amount: -50.75,
        type: 'debit'
      });
    });

    it('should parse transaction line with very small amount', () => {
      const line = '01/01/202302/01/2023 Service Fee                   -0.10';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '01/01/2023',
        postingDate: '02/01/2023',
        description: 'Service Fee',
        amount: -0.10,
        type: 'debit'
      });
    });

    it('should parse transaction line with zero amount', () => {
      const line = '01/01/202302/01/2023 Adjustment                     0.00';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '01/01/2023',
        postingDate: '02/01/2023',
        description: 'Adjustment',
        amount: 0.00,
        type: 'credit' // Zero is treated as credit
      });
    });

    it('should return null for invalid lines', () => {
      expect(parser['parseTransactionLine']('')).toBeNull();
      expect(parser['parseTransactionLine']('invalid')).toBeNull();
      expect(parser['parseTransactionLine']('01/01/2023')).toBeNull();
      expect(parser['parseTransactionLine']('Too short')).toBeNull();
    });

    it('should parse foreign transaction line correctly', () => {
      const line = '26/01/202527/01/2025*WWW.PERPLEXITY.AI SAN FRANCISCO US 20.00 USD (1 AED = USD 0.26396) 75.77';
      const result = parser['parseTransactionLine'](line);
      
      expect(result).toEqual({
        transactionDate: '26/01/2025',
        postingDate: '27/01/2025',
        description: '*WWW.PERPLEXITY.AI SAN FRANCISCO US 20.00 USD (1 AED = USD 0.26396)',
        amount: 75.77,
        type: 'credit'
      });
    });
  });

  describe('extractTransactionSection', () => {
    it('should extract the transaction section correctly', () => {
      const fullText = `
        Header info
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        05/01/202306/01/2023 Salary                      1000.00
        STATEMENT SUMMARY (AED)
        Footer info
      `;
      
      const result = parser['extractTransactionSection'](fullText);
      
      expect(result).not.toContain('Transaction Date,Description,Date,Amount');
      expect(result[0]).toContain('01/01/202302/01/2023 Coffee Shop');
      expect(result).not.toContain('STATEMENT SUMMARY (AED)');
      expect(result).not.toContain('Footer info');
    });

    it('should return empty if start marker not found', () => {
      const textNoStartMarker = 'Some text without markers';
      const result = parser['extractTransactionSection'](textNoStartMarker);
      expect(result.length).toBe(0);
    });
    
    it('should handle input with start marker but no end marker', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        05/01/202306/01/2023 Salary                      1000.00
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      
      expect(result[0]).toContain('01/01/202302/01/2023 Coffee Shop');
      expect(result[1]).toContain('05/01/202306/01/2023 Salary');
    });
    
    it('should handle input with multiple instances of start marker', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        Additional info
        Transaction Date,Description,Date,Amount
        05/01/202306/01/2023 Salary                      1000.00
        STATEMENT SUMMARY (AED)
        Footer info
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      // Should extract from first occurrence of start marker
      expect(result[0]).toContain('01/01/202302/01/2023 Coffee Shop');
      expect(result).not.toContain('Additional info');
      expect(result).not.toContain('STATEMENT SUMMARY (AED)');
    });

    it('should extract and filter transaction lines correctly', () => {
      const fullText = `
        Header info
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        Invalid line without date format
        05/01/2023 06/01/2023 Salary                      1000.00
        STATEMENT SUMMARY (AED)
        Footer info
      `;
      
      const result = parser['extractTransactionSection'](fullText);
      
      // Should return an array of filtered lines now
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toContain('01/01/2023');
      expect(result[1]).toContain('05/01/2023');
      expect(result.some(line => line.includes('Invalid line'))).toBe(false);
    });

    it('should return empty array if start marker not found', () => {
      const textNoStartMarker = 'Some text without markers';
      const result = parser['extractTransactionSection'](textNoStartMarker);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it('should filter out lines that do not start with date format', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        01/01/202302/01/2023 Coffee Shop                  -25.50
        This line should be filtered out
        random text that doesn't match date format
        05/01/202306/01/2023 Salary                      1000.00
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      expect(result.length).toBe(2);
      expect(result[0]).toContain('01/01/2023');
      expect(result[1]).toContain('05/01/2023');
    });
    
    it('should handle input with multiple instances of start marker', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        01/01/2023 02/01/2023 Coffee Shop                  -25.50
        Additional info
        Transaction Date,Description,Date,Amount
        05/01/2023 06/01/2023 Salary                      1000.00
        STATEMENT SUMMARY (AED)
        Footer info
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      // Should extract from first occurrence of start marker
      expect(result.length).toBe(2);
      expect(result[0]).toContain('01/01/2023');
      expect(result[1]).toContain('05/01/2023');
    });

    it('should handle regular single line transactions', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50
        STATEMENT SUMMARY (AED)
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      expect(result.length).toBe(1);
      expect(result[0]).toBe('26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50');
    });
    
    it('should handle multi-line foreign transactions', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50
        26/01/202527/01/2025*WWW.PERPLEXITY.AI SAN FRANCISCO US 20.00 USD
        (1 AED = USD 0.26396)
        75.77
        26/01/202527/01/2025GOOD LIFE CAFE AND RES DUBAI ARE        73.00
        STATEMENT SUMMARY (AED)
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      expect(result.length).toBe(3);
      expect(result[0]).toBe('26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50');
      expect(result[1]).toBe('26/01/202527/01/2025*WWW.PERPLEXITY.AI SAN FRANCISCO US 20.00 USD (1 AED = USD 0.26396) 75.77');
      expect(result[2]).toBe('26/01/202527/01/2025GOOD LIFE CAFE AND RES DUBAI ARE        73.00');
    });

    it('should handle multi-line foreign transactions 0  Stubhub GBP example', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50
        26/01/202527/01/2025*STUBHUB INC 8667882482 USA 950.69 GBP
        (1 AED = GBP 0.21119)
        4,501.56
        26/01/202527/01/2025GOOD LIFE CAFE AND RES DUBAI ARE        73.00
        STATEMENT SUMMARY (AED)
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      expect(result.length).toBe(3);
      expect(result[0]).toBe('26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50');
      expect(result[1]).toBe('26/01/202527/01/2025*STUBHUB INC 8667882482 USA 950.69 GBP (1 AED = GBP 0.21119) 4,501.56');
      expect(result[2]).toBe('26/01/202527/01/2025GOOD LIFE CAFE AND RES DUBAI ARE        73.00');
    });

    it('should handle multi-line foreign transactions where next line is also multi line', () => {
      const text = `
        Header info
        Transaction Date,Description,Date,Amount
        26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50
        26/01/202527/01/2025*STUBHUB INC 8667882482 USA 950.69 GBP
        (1 AED = GBP 0.21119)
        4,501.56
        26/01/202527/01/2025GOOD LIFE CAFE AND RES DUBAI ARE        
        73.00
        STATEMENT SUMMARY (AED)
      `;
      
      const result = parser['extractTransactionSection'](text);
      
      expect(result.length).toBe(3);
      expect(result[0]).toBe('26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE              23.50');
      expect(result[1]).toBe('26/01/202527/01/2025*STUBHUB INC 8667882482 USA 950.69 GBP (1 AED = GBP 0.21119) 4,501.56');
      expect(result[2]).toBe('26/01/202527/01/2025GOOD LIFE CAFE AND RES DUBAI ARE 73.00');
    });
  });

  describe('doesLineEndWithAmount', () => {
    it('should return true for lines ending with simple amounts', () => {
      expect(parser['doesLineEndWithAmount']('26/01/202526/01/2025CONNECTECH L.L.C DUBAI ARE 23.50')).toBe(true);
      expect(parser['doesLineEndWithAmount']('Some text with amount 100.00')).toBe(true);
      expect(parser['doesLineEndWithAmount']('Negative amount -50.75')).toBe(true);
    });

    it('should return true for lines ending with amounts containing commas', () => {
      expect(parser['doesLineEndWithAmount']('Text ending with 1,234.56')).toBe(true);
      expect(parser['doesLineEndWithAmount']('Large amount 10,000.00')).toBe(true);
      expect(parser['doesLineEndWithAmount']('Very large amount 1,000,000.00')).toBe(true);
    });

    it('should return false for lines not ending with valid amounts', () => {
      expect(parser['doesLineEndWithAmount']('Text without amount')).toBe(false);
      expect(parser['doesLineEndWithAmount']('Amount with text after 100.00 AED')).toBe(false);
      expect(parser['doesLineEndWithAmount']('26/01/202527/01/2025*WWW.PERPLEXITY.AI SAN FRANCISCO US 20.00 USD')).toBe(false);
    });

    it('should return false for lines ending with incomplete or malformed numbers', () => {
      expect(parser['doesLineEndWithAmount']('Incomplete number 123.')).toBe(false);
      expect(parser['doesLineEndWithAmount']('Number with non-numeric suffix 123.45)')).toBe(false);
      expect(parser['doesLineEndWithAmount']('Number in parentheses (123.45)')).toBe(false);
    });

    it('should handle edge cases with currency conversion information', () => {
      expect(parser['doesLineEndWithAmount']('USD 20.00 (1 AED = USD 0.26396)')).toBe(false);
      expect(parser['doesLineEndWithAmount']('(1 AED = GBP 0.21119) 4,501.56')).toBe(true);
    });
  });
});
