/**
 * Production-safe logger
 * Only logs in development mode to keep production console clean
 */
class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === "development";

  log(...args: any[]) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  error(...args: any[]) {
    if (this.isDevelopment) {
      console.error(...args);
    }
  }

  warn(...args: any[]) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  info(...args: any[]) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }
}

export const productionLogger = new ProductionLogger();
