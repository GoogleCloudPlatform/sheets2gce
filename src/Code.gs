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

// this file contains Google Workspace Editor Add-On Functions
// and makes use of other functions as defined in other files

/**
 * called when the add-on is installed
 */
function onInstall() {
}

/**
 * called when a spreadsheet is opened/created
 */
function onOpen() {
  checkTrigger();
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {
      name: 'Import from GCE',
      functionName: 'importAll',
    },
  ];
  spreadsheet.addMenu('Sheets2GCE', menuItems);
}

/**
 * The event handler triggered when editing the spreadsheet
 * note that the simple onEdit trigger does not have sufficient
 * permissions; therefore an installable trigger is used
 * @param {!Event} e The event.
 */
function onEdit(e) {
}

/**
 * checks for onEdit installable trigger
 * deletes previous and creates an onEdit installable trigger
 */
function checkTrigger() {
   deleteTrigger();
   createOnEditTrigger();
}

/**
 * Deletes previous onEdit triggers.
 */
function deleteTrigger() {
  // Loop over all triggers.
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getEventType() == ScriptApp.EventType.ON_EDIT) {
      ScriptApp.deleteTrigger(allTriggers[i]);
      if (DEBUG_LEVEL > 5) {
        Logger.log('deleted (previously installed) installable trigger ' +
                    allTriggers[i].getUniqueId + 'for onEdit');
      }
    }
  }
}

/**
 * Creates an (installable) trigger for onEdit
 */
function createOnEditTrigger() {
  var ssApp = SpreadsheetApp.getActive();
  ScriptApp.newTrigger(TRIGGER_ID)
      .forSpreadsheet(ssApp)
      .onEdit()
      .create();
  if (DEBUG_LEVEL > 5) {
    Logger.log('created installable trigger for onEdit');
  }
}

/**
 * The event handler triggered when editing
 * the spreadsheet by createOnEditTrigger
 * @param {!Event} e The event.
 */
function onEditInstallableTrigger(e) {
  var model = transformEvent(e);
  // check if change was on a user defined label
  if (model.col >= METADATA.length + 1) {
    if (! isValidLabelValue(model.value)) {
      return;
    } 
    model.key = e.range.getSheet().getRange(1, model.col).getValue();
  } else {
    Logger.log('currently only supporting updating user defined labels');
    return;
  }
  if (DEBUG_LEVEL > 5) {
    Logger.log(model);
  }
  // update VM labels using GCE API
  var data = updateLabelsInGce(model);
  if (DEBUG_LEVEL > 7) {
    Logger.log('response = ');
    Logger.log(data);
  }
  model.operation = data.name;
  model.operation_link = data.selfLink;
  // TODO: check job for (sucessful) completion
  // add a log entry in the Logs sheet
  addLogEntry(model);
}
