/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const tracePath = path.join(__dirname, '../.next/dev/trace');
const outputPath = path.join(__dirname, '../.next/dev/trace-formatted.json');

try {
  if (!fs.existsSync(tracePath)) {
    console.error(`Trace file not found at: ${tracePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(tracePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const allEvents = [];
  for (const line of lines) {
    try {
      const arr = JSON.parse(line);
      if (Array.isArray(arr)) {
        allEvents.push(...arr);
      } else {
        allEvents.push(arr);
      }
    } catch {
      // Ignore parsing errors for trailing lines
    }
  }

  // Map Next.js custom trace events to standard Chrome Trace Event Format (Event Model 'X')
  const chromeEvents = allEvents.map((event) => {
    // Next.js timestamps (startTime) are in epoch milliseconds. 
    // Chrome Trace Event Format expects microseconds (us).
    const tsMicroseconds = event.startTime ? event.startTime * 1000 : event.timestamp;
    
    return {
      name: event.name,
      cat: event.tags?.trigger || event.tags?.path || 'nextjs',
      ph: 'X', // 'X' represents a complete event (with start and duration)
      ts: tsMicroseconds,
      dur: event.duration, // Next.js duration is already in microseconds
      pid: 1,
      tid: event.parentId || 1,
      args: {
        id: event.id,
        parentId: event.parentId,
        ...event.tags
      }
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(chromeEvents, null, 2));
  console.log(`\n\x1b[32m✓ Trace file formatted successfully!\x1b[0m`);
  console.log(`Saved formatted trace to: \x1b[36m${outputPath}\x1b[0m`);
  console.log(`You can now drag-and-drop this new file directly into:`);
  console.log(`  - \x1b[35mchrome://tracing\x1b[0m`);
  console.log(`  - \x1b[35mhttps://ui.perfetto.dev/\x1b[0m\n`);
} catch (error) {
  console.error('Error formatting trace:', error);
}
