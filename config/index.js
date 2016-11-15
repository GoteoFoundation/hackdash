
/**
 * Expose the configuration. Uses the test config if NODE_ENV env setting
 * is set as 'test'. Otherwise it uses the default config file
 */

import config from 'config/config.json';
import testConfig from 'config/config.test.json';

export default process.env.NODE_ENV === 'test' ? testConfig : config;
