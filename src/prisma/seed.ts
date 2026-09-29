import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  const records: any[] = [];
  const csvFilePath = path.join(__dirname, '../db.csv');

  console.log('Wczytywanie pliku CSV...');

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        let location: number[] = [];
        if (row.location) {
          try {
            location = JSON.parse(row.location.replace(/'/g, '"'));
          } catch {
            location = [];
          }
        }

        let freezeFrame: any = null;
        if (row.shot_freeze_frame && row.shot_freeze_frame.trim() !== '') {
          try {
            const jsonStr = row.shot_freeze_frame
              .replace(/'/g, '"')
              .replace(/\bTrue\b/g, 'true')
              .replace(/\bFalse\b/g, 'false')
              .replace(/\bNone\b/g, 'null');
            freezeFrame = JSON.parse(jsonStr);
          } catch {
            freezeFrame = null;
          }
        }

        records.push({
          period: parseInt(row.period, 10),
          position: row.position,
          location: location,
          playPattern: row.play_pattern,
          underPressure: row.under_pressure === 'True',
          shotType: row.shot_type,
          shotBodyPart: row.shot_body_part,
          shotTechnique: row.shot_technique,
          shotFirstTime: row.shot_first_time === 'True',
          shotDeflected: row.shot_deflected === 'True',
          shotFreezeFrame: freezeFrame,
          shotAerialWon: row.shot_aerial_won === 'True',
          shotStatsbombXg: parseFloat(row.shot_statsbomb_xg),
          xg: parseFloat(row.xG),
        });
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  console.log(`Wczytano ${records.length} rekordów. Trwa zapis do bazy...`);

  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.shot.createMany({
      data: batch,
    });
  }

  console.log('Seed zakończony sukcesem!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });