import * as dotenv from 'dotenv';
import { argv } from 'yargs';

function loadEnvironment(path : string = '.env') {
  console.log(`Loading environment from ${path}`);
  const result = dotenv.config({ path });
  if (result.error) {
    console.error(result.error);
    console.error(`Environment file ${path} could no be loaded. Be sure it exists`);
  }
}

function getEnvironmentPath() {
  const environment : string  = <string> (
    process.env.NODE_ENV
    || process.env.ENVIRONMENT
    || argv.environment
    || (argv.production ? 'production' : undefined)
    || (argv.staging ? 'staging' : undefined)
    || (argv.developer ? 'developer' : undefined)
    || (argv.local ? 'local' : undefined)
  );

  const path = environment ? `.env.${environment.toLowerCase()}` : '.env';
  return path;
}

export function loadEnv(path? : string) {
  loadEnvironment(path || getEnvironmentPath());
}

export default loadEnv;