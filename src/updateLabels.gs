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
 * validates the value of a label
 * cf. https://cloud.google.com/resource-manager/docs/creating-managing-labels#requirements
 * @param {string} value the value of a label to validate
 * @return {boolean} returns true in case of a valid label and false otherwise
 */
function isValidLabelValue(value) {
  Logger.log('label: ' + value);
  Logger.log(value.search(new RegExp('[^a-z0-9_-]')));
  var valid = (value.length <= 63) && (value.search(new RegExp('[^a-z0-9_-]')) < 0);
  if (! valid) {
    if (DEBUG_LEVEL > 0) {
      Logger.log('label value is not valid; please consult ' +
        'https://cloud.google.com/resource-manager/docs/creating-managing-labels#requirements'
      );
     }
  }
  return valid;
}

/**
 * triggered by onEdit
 * creates a model out of the edit event
 * @param {!Event} e The onEdit event to process.
 * @return {Object} A model comprising the data to perform an update.
 */
function transformEvent(e) {
  var sheet = e.range.getSheet();
  var model = {
    date: new Date(),
    projectId: sheet.getSheetName(),
    row: e.range.getRow(),
    col: e.range.getColumn(),
    old: e.oldValue,
    value: e.value,
  };
  model.zone = sheet.getRange(model.row, 1).getValue();
  model.name = sheet.getRange(model.row, 2).getValue();
  model.labels = {};
  for (var col = METADATA.length + 1; col < sheet.getLastColumn(); col++) {
    var value = sheet.getRange(model.row, col).getValue();
    if (value.length > 0) {
      model.labels[sheet.getRange(1, col).getValue()] = value;
    }
  }
  model.labelFingerprint = sheet.getRange(
          model.row, sheet.getLastColumn()
      ).getValue();
  return model;
}

/**
 * adds a log entry for the edit into a counter-chronological logs sheet
 * @return {Object} A model comprising the old and updated data.
 */
function addLogEntry(model) {
  if (DEBUG_LEVEL > 8) {
    Logger.log('adding log entry:');
    Logger.log(model);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(LOGS_SHEET_NAME);

  // create 'Logs' sheet if not existing
  if (! sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(LOGS_SHEET_NAME);
    // add METADATA (
    var range = sheet.getRange(1, 1, 1, METADATA_LOGS.length)
        .setValues([METADATA_LOGS]);
    range.createFilter();
  }

  // remove protection
  sheet.protect().remove();

  // insert new row for new log entry
  sheet.insertRowAfter(1);
  // add entry in Row 2 (counter chronological)
  var values = [
    model.date,
    model.projectId,
    model.zone,
    model.name,
    model.key,
    model.value,
    model.old,
    '=HYPERLINK("https://www.googleapis.com/compute/v1/projects/'
        + model.projectId + '/zones/' + model.zone
        + '/operations/' + model.operation + '", "' + model.operation + '")',
  ];
  sheet.getRange(2, 1, 1, values.length).setValues([values]);

  // protect sheet
  sheet.protect();
}
