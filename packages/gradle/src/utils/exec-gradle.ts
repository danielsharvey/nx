import { workspaceRoot } from '@nx/devkit';
import { ExecFileOptions } from 'child_process';
import {
  ExecFileSyncOptionsWithBufferEncoding,
  execFile,
  execFileSync,
} from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export function execGradle(
  args: string[],
  execOptions?: ExecFileSyncOptionsWithBufferEncoding
) {
  const gradleBinaryPath = getGradleBinaryPath();

  return execFileSync(gradleBinaryPath, args, execOptions);
}

export function getGradleBinaryPath(): string {
  const gradleFile = process.platform.startsWith('win')
    ? 'gradlew.bat'
    : 'gradlew';
  const gradleBinaryPath = join(workspaceRoot, gradleFile);
  if (!existsSync(gradleBinaryPath)) {
    throw new Error('Gradle is not setup. Run "gradle init"');
  }

  return gradleBinaryPath;
}

export function getGradleRelativePath(path: string): string {
  const gradleBinaryPath = getGradleBinaryPath();
  let relativePath = relative(path, gradleBinaryPath);
  if (relativePath.startsWith('gradlew')) {
    relativePath = process.platform.startsWith('win')
      ? `.\\${relativePath}`
      : `./${relativePath}`;
  }
  return relativePath;
}

export function execGradleAsync(
  args: ReadonlyArray<string>,
  execOptions?: ExecFileOptions
) {
  const gradleBinaryPath = getGradleBinaryPath();

  return new Promise<Buffer>((res, rej) => {
    const cp = execFile(gradleBinaryPath, args, execOptions);

    let stdout = Buffer.from('');
    cp.stdout?.on('data', (data) => {
      stdout += data;
    });

    cp.on('exit', (code) => {
      if (code === 0) {
        res(stdout);
      } else {
        rej(
          new Error(
            `Executing Gradle with ${args.join(
              ' '
            )} failed with code: ${code}. \nLogs: ${stdout}`
          )
        );
      }
    });
  });
}
