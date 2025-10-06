import chalk from 'chalk';

export class Logger {
  private static verbose = false;

  static setVerbose(value: boolean) {
    Logger.verbose = value;
  }

  static info(message: string) {
    console.log(chalk.blue(message));
  }

  static success(message: string) {
    console.log(chalk.green(message));
  }

  static warn(message: string) {
    console.log(chalk.yellow(message));
  }

  static error(message: string) {
    console.error(chalk.red('Error:'), message);
  }

  static debug(message: string) {
    if (Logger.verbose) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  static progress(current: number, total: number, message: string) {
    if (Logger.verbose) {
      const percentage = Math.round((current / total) * 100);
      console.log(chalk.cyan(`[${percentage}%] ${message}`));
    }
  }
}
