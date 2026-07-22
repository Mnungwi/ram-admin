import 'zone.js';

/***************************************************************************************************
 * Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
 */
import '@angular/localize/init';

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

//for ng2-dragula
(window as any).global = window;