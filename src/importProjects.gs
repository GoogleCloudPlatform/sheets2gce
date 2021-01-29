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
 * for all the open sheets except the Logs sheet import the GCE instances of
 * projects that projectId corresponds to the name of the sheet
 */
function importAll() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var sheet in sheets) {
    var projectId = sheets[sheet].getSheetName();
    // ignoring Logs sheet
    if (projectId !== LOGS_SHEET_NAME) {
      var data = importFromGce(projectId);
      updateSheet(
        sheets[sheet],
        transformGce(data)
      );
    }
  }
}

/**
 * Transforms the array (pages) of JSON objects as the result from the Compute API call comprising
 * the instances to a set of rows.
 * @param {Object} dataPages to transform
 * @return {!Array<!Array<string>>} the model
 */
function transformGce(dataPages) {
  var model = [];
  for (var page in dataPages) {
    var data = dataPages[page];
    for (var zone in data['items']) {
      if (data['items'][zone].hasOwnProperty('instances')) {
        for (var i in data['items'][zone]['instances']) {
          var instance = data['items'][zone]['instances'][i];
          if (DEBUG_LEVEL > 8) {
            Logger.log(instance);
          }
          var model_entry = [];
          var entry;
          for (var col = 0; col < METADATA.length; col++) {
            entry = instance[METADATA[col]];
            if (METADATA[col] === 'zone') {
              entry = zone.substring('zones/'.length);
            } else if (METADATA[col] === 'machineType') {
              // just take the last part of machine type - we do not need the (full) URL
              entry = entry.replace(/.*\//, '');
            }
            model_entry.push(entry);
          }
          model_entry.push(instance['labels']);
          model_entry.push(instance['labelFingerprint']);
          if (DEBUG_LEVEL > 6) {
            Logger.log('adding ' + model_entry);
          }
          model.push(model_entry);
        }
      }
    }
  }
  return model;
}

/**
 * collects and sorts all labels of instances in the model
 * @param {!Array<!Array<string>>} data the model as an array of array of strings
 * @return {!Array<string>} a sorted array of labels
 */
function getLabels(data) {
  var labelsSet = {}; //new Set();
  for (var i=0; i < data.length; i++) {
    for (var label in data[i][METADATA.length]) {
      if (! (labelsSet.hasOwnProperty(label))) {
      //if (!labelsSet.has(label)) {
        if (DEBUG_LEVEL > 7) {
          Logger.log("found new label " + label);
        }
        labelsSet[label] = true;
        //labelsSet.add(label);
      } else {
        if (DEBUG_LEVEL > 8) {
          Logger.log("label already in the set: " + label);
        }
      }
    }
  }

  var labels = Object.keys(labelsSet).sort()
  //var labels = Array.from(labelsSet);
  //labels.sort();
  if (DEBUG_LEVEL > 5) {
    Logger.log("all labels (sorted): " + labels);
  }

  return labels;
}

/**
 * updates a sheet by setting the metadata (i.e., names of the columns)
 * and the data hides a labelFingerprint column
 * finally, creates a filter using the metadata row
 * @param {!Spreadsheet} sheet the spreadsheet to update,
 *    cf. https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#Spreadsheet
 * @param {!Array<!Array<string>>} data the model as an array of array of strings
 */
function updateSheet(sheet, data) {
  var labels = getLabels(data);

  // clear the sheet
  sheet.clear();
  // next set the METADATA in the first row
  sheet.getRange(1, 1, 1, METADATA.length).setValues([METADATA]);
  // add columns for labels at the end
  if (labels.length > 0) {
    sheet.getRange(1, METADATA.length + 1, 1, labels.length)
         .setValues([labels]);
    sheet.getRange(1, METADATA.length + labels.length + 1)
        .setValue('labelFingerprint');
  }
  for (var i=0; i < data.length; i++) {
    var row = i + 2;
    var j=0;
    while (j < METADATA.length) {
      var col = j + 1;
      var value = data[i][j];
      sheet.getRange(row, col).setValue(value);
      j++;
    }
    for (var label in data[i][j]) {
      var col = j + 1 + labels.indexOf(label);
      var value = data[i][j][label];
      sheet.getRange(row, col).setValue(value);
    }
    j++;
    var col = j + labels.length;
    var value = data[i][j]
    sheet.getRange(row, col).setValue(value);
  }

  // hide labelFingerprint column
  sheet.hideColumns(METADATA.length + labels.length + 1);
  
  // ideally create/apply a data validation for label names on respective cells
  // https://developers.google.com/apps-script/reference/spreadsheet/data-validation
  // and make use of the function isValidLabelValue(value)

  // create a filter
  var range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
  if (range.getFilter() != null) {
    range.getFilter().remove();
  }
  range.createFilter();
}
