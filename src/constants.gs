/**
 *  Copyright 2019-2021 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * set to > 0 to enable logging for debugging (valid range: 0 - 9)
 * @type {int}
 */
var DEBUG_LEVEL = 7;

/**
 * the metadata of the sheets that reflect the GCE instances of respective
 * projects, i.e., the name of the columns
 * the keys should match the keys from the Compute API JSON
 * @type {Array.<string>}
 */
var METADATA = [
  'zone',
  'name',
  'description',
  'creationTimestamp',
  'status',
  'machineType',
  'cpuPlatform',
];

/**
 * The name of the sheet (referred to as 'Logs' sheet) that shall record the
 * changes for debugging or user auditing purposes.
 * @type {string}
 */
var LOGS_SHEET_NAME = 'Logs';

/**
 * the metadata of the 'Logs' sheet, i.e., the name of the columns
 * @type {Array.<string>}
 */
var METADATA_LOGS = [
  'timestamp',
  'projectId',
  'zone',
  'name',
  'label',
  'value',
  'old',
  'operation',
];

/**
 * @type {string} The name of the installable trigger,
 * cf. https://developers.google.com/apps-script/guides/triggers/installable
 */
var TRIGGER_ID = 'onEditInstallableTrigger';

/**
 * @type {string} The name of the OAuth2 service.
 */
var OAUTH_SERVICE_NAME = 'Sheets2GCE';

/**
 * @type {string} The name of the application.
 */
var APP_NAME = 'Sheets2GCE';

/**
 * @type {string} The version of the application.
 */
var APP_VERSION = '1.0.0';

/**
 * @type {string} The HTTP User-Agent to use.
 */
var USER_AGENT = 'google-pso-tool/' + APP_NAME + '/' + APP_VERSION;

/**
 * The maximum number of results to return (per page).
 * The value of 0 still caps number of results to default of 500 (= max), cf. b/141720155
 * @type {int}
 */
var MAX_RESULTS = 500;
