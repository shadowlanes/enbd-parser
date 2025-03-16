# ENBD Parser

A utility to parse Emirates NBD credit card statements (PDF) and convert them to CSV format for easier analysis.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd enbd-parser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Parse Command

The parse command converts a PDF bank statement to CSV format.

#### Basic Usage

```bash
npm run parse -- <path-to-pdf-file>
```

Example:
```bash
npm run parse -- ./statements/march-2023.pdf
```

This will generate a CSV file in the current directory with a timestamp in the filename (e.g., `transactions-2023-04-01T14-30-45-000Z.csv`).

#### Custom Output Path

You can specify a custom output path for the CSV file:

```bash
npm run parse -- <path-to-pdf-file> <output-path>
```

Example:
```bash
npm run parse -- ./statements/march-2023.pdf ./exports/march-transactions.csv
```

### Generated CSV Format

The generated CSV file contains the following columns:
- Transaction Date - Date when the transaction occurred
- Description - Description of the transaction
- Date - Processing date
- Amount - Transaction amount

## Troubleshooting

If you encounter issues with PDF parsing:

1. Ensure your PDF is not password protected
2. The parser is designed for Emirates NBD credit card statements - other formats may not work correctly
3. Check console output for specific error messages

## License

MIT
