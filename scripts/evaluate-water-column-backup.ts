import { readFile } from 'node:fs/promises';
import { argv } from 'node:process';
import { evaluateWaterColumnEmpiricalValidation } from '../src/services/waterColumnEmpiricalValidation';

const backupPath = argv[2];
if (!backupPath) {
  throw new Error('Gebruik: bun run tsx scripts/evaluate-water-column-backup.ts <vislogboek-backup.json>');
}
const backup = JSON.parse(await readFile(backupPath, 'utf8')) as {
  sessions?: unknown[];
  locations?: unknown[];
  prognosisSnapshots?: unknown[];
};
if (!Array.isArray(backup.sessions) || !Array.isArray(backup.locations) ||
    !Array.isArray(backup.prognosisSnapshots)) {
  throw new Error('Backup mist sessions, locations of prognosisSnapshots; gebruik een volledige Vislogboek JSON-backup.');
}
const report = evaluateWaterColumnEmpiricalValidation(
  backup.sessions as never[],
  backup.prognosisSnapshots as never[],
  backup.locations as never[]
);
const { samples, ...summary } = report;
console.log(JSON.stringify({
  ...summary,
  samples: samples.map(({ measurementKey, sessionId, locationId, ...sample }) => sample),
}, null, 2));
