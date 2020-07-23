import { HydraSanitizer } from 'utils'
import 'mocha';

describe('HydraSanitizer', () => {
  it('Sanitizes hydra', () => {
    const hydraSanitizer = new HydraSanitizer('redis://localhost:6379/15');
  });
});