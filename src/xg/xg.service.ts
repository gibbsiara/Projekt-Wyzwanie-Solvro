import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class XgService {
  async predictWithPython(shotData: any): Promise<number> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.resolve(process.cwd(), 'venv/bin/python');
    const scriptPath = path.resolve(process.cwd(), 'src/scripts/predict_xg.py');
    
    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new InternalServerErrorException(
            `Błąd procesu Pythona (kod ${code}): ${errorData.trim()}`,
          ),
        );
      }

      try {
        const result = JSON.parse(outputData);
        resolve(result.xg);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        reject(
          new InternalServerErrorException(
            `Nie udało się sparsować odpowiedzi z Pythona: ${message}`,
          ),
        );
      }
    });

    // Przesyłamy cały obiekt strzału do Pythona:
    pythonProcess.stdin.write(JSON.stringify(shotData));
    pythonProcess.stdin.end();
  });
  }
}