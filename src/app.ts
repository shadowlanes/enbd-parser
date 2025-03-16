import { ParseCommand } from './commands/parse-command';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'parse') {
    const pdfPath = args[1];
    const outputPath = args[2];
    
    if (!pdfPath) {
      console.error('Error: PDF path is required');
      console.log('Usage: npm run parse -- <pdf-path> [output-path]');
      process.exit(1);
    }
    
    const parseCommand = new ParseCommand();
    await parseCommand.execute(pdfPath, outputPath);
  } else {
    console.log("ENBD Parser");
    console.log("Available commands:");
    console.log("  parse <pdf-path> [output-path] - Parse bank statement and generate CSV");
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});