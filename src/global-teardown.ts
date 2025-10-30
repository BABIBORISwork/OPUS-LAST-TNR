import { spawn } from 'node:child_process';

async function run(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

export default async function globalTeardown(): Promise<void> {
  try {
    await run('npx', ['allure', 'generate', '--clean', 'allure-results', '-o', 'allure-report']);
  } catch (error) {
    console.warn('[Allure] Génération du rapport échouée (ignore en local si Allure non installé):', (error as Error).message);
  }
}
