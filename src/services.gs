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
 * @type {?Service_} The OAuth2 service,
 *     cf. https://github.com/gsuitedevs/apps-script-oauth2/blob/master/dist/OAuth2.gs
 */
var oAuth2service = null;

/**
 * Return the OAuth2 service if already existant;
 * creates and returns a service otherwise.
 * @param {boolean=} reuse previously created Service_ object
 * @returns {?Service_} The OAuth2 service.
 */
function getService(reuse) {
  if (! oAuth2service || ! reuse) {
    if (typeof SERVICE_ACCOUNT_DATA !== 'undefined') {
      if (DEBUG_LEVEL > 2) {
        Logger.log('found a service account, using credentials');
      }
      oAuth2service = OAuth2.createService(OAUTH_SERVICE_NAME)
          .setAuthorizationBaseUrl(SERVICE_ACCOUNT_DATA.auth_uri)
          .setTokenUrl(SERVICE_ACCOUNT_DATA.token_uri)
          .setPrivateKey(SERVICE_ACCOUNT_DATA.private_key)
          .setIssuer(SERVICE_ACCOUNT_DATA.client_email)
          .setPropertyStore(PropertiesService.getScriptProperties())
          .setParam('access_type', 'offline')
          .setScope([
            'https://www.googleapis.com/auth/compute',
            'https://www.googleapis.com/auth/script.external_request',
          ]);
    } else {
      if (DEBUG_LEVEL > 2) {
        Logger.log('using active user for authentication (no service account)');
      }
      oAuth2service = OAuth2.createService(OAUTH_SERVICE_NAME)
          .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
          .setTokenUrl('https://accounts.google.com/o/oauth2/token')
          .setPropertyStore(PropertiesService.getUserProperties())
          .setParam('access_type', 'offline')
          .setParam('login_hint', Session.getActiveUser().getEmail())
          .setScope([
            'https://www.googleapis.com/auth/compute',
            'https://www.googleapis.com/auth/script.external_request',
          ]);
    }
  } else {
    if (DEBUG_LEVEL > 2) {
      Logger.log('reusing previously created oAuth2service');
    }
  }
  return oAuth2service;
}

/**
 * A helper function To make a REST service request.
 * @param {string} method The HTTP method such as 'GET' or 'POST'.
 * @param {string} url The URL of the service endpoint.
 * @param {?Object} payload An optional payload (i.e., request body).
 * @return {?Object} The (parsed) JSON object.
 */
function makeServiceCall(method, url, payload) {
  if (DEBUG_LEVEL > 5) {
    Logger.log(method + ' ' + url);
  }
  var service = getService();
  if (DEBUG_LEVEL > 7) {
    Logger.log('resetting service');
  }
  service.reset();
  var accessToken = service.getAccessToken();
  var headers =
    {
      'Authorization': 'Bearer ' + accessToken,
      'User-Agent': USER_AGENT,
    };
  var options =
    {
      'method': method,
      'contentType': 'application/json',
      'headers': headers,
      'muteHttpExceptions': true,
    };
  if (payload) {
    options['payload'] = JSON.stringify(payload);
  }
  if (DEBUG_LEVEL > 6) {
    Logger.log(options);
  }
  var response = UrlFetchApp.fetch(url, options);
  var json = response.getContentText();
  return JSON.parse(json);
}

/**
 * makes (a) service call(s) to the Compute API's instances.aggregatedList method
 * multiple calls may be performed due to paging
 * the responses are stored as JSON objects in an array that is returned
 * @param {string} projectId the GCP Project ID
 * @return {?<!Array<Object>>} an array of the JSON objects,
 *     cf. https://cloud.google.com/compute/docs/reference/rest/v1/instances/aggregatedList
 */
function importFromGce(projectId) {
  var method = 'get';
  var url = 'https://www.googleapis.com/compute/v1/projects/' + projectId
      + '/aggregated/instances';
  var query = 'maxResults=' + MAX_RESULTS;
  url += '?' + query;
  var data = [];
  var page = {};
  do {
    var complete_url = url;
    if (page.nextPageToken) {
      complete_url += '&pageToken=' + page.nextPageToken;
      if (DEBUG_LEVEL > 7) {
        Logger.log('requesting results with pageToken ' + page.nextPageToken);
      }
    }
    page = makeServiceCall(method, complete_url, null);
    data.push(page);
  } while (page.nextPageToken);
  return data;
}

/**
 * updates the labels of instances in GCE
 * @param {Object} model a JSON object comprising the new labels and a
 *     labelFingerprint as well as information such as the projectId, the zone
 *     and name of the instance to be updated
 * @return {Object} the returned (parsed) JSON object
 */
function updateLabelsInGce(model) {
  var method = 'post';
  var url = 'https://www.googleapis.com/compute/v1/projects/' + model.projectId
      + '/zones/' + model.zone
      + '/instances/' + model.name
      + '/setLabels';
  var data = {
    'labels': model.labels,
    'labelFingerprint': model.labelFingerprint,
  };
  return makeServiceCall(method, url, data);
}
