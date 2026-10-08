/**
 * All German texts, merged from one file per part of the app (keys are the English texts).
 */
import shell from './shell.js';
import gear from './gear.js';
import pack from './pack.js';
import bikes from './bikes.js';
import ride from './ride.js';
import common from './common.js';
import tips from './tips.js';
import care from './care.js';
import setup from './setup.js';
import schedule from './schedule.js';

export default { ...care, ...ride, ...bikes, ...gear, ...pack, ...shell, ...common, ...tips, ...setup, ...schedule };
