# Sheets2GCE Add-On 

This repository contains source code for a
[Google Workspace Add-On](https://developers.google.com/gsuite/add-ons/overview),
consuming the [GCE API](https://cloud.google.com/compute/docs/reference/rest/v1/)
for managing Google Compute Engine (GCE) instances in Google Sheets.

## Usage

* In GCP Console UI (for each project that you would like to manage through the Sheets Add-On)
  * [Enable GCE API](https://console.cloud.google.com/apis/api/gcereplayprecisequotasvc1.googleapis.com/overview)
  * [Create a service account](https://console.cloud.google.com/iam-admin/serviceaccounts)
    * assign the `roles/compute.instanceAdmin.v1` [Compute Instance Admin (v1)](https://cloud.google.com/iam/docs/understanding-roles#compute-engine-roles) role - or even better: create a custom role with specific [permissions](https://cloud.google.com/compute/docs/access/iam-permissions) only, in particular:
        * `compute.instances.list`
        * `compute.instances.setLables`
* Google Workspace
  * [Open a new Sheets](https://docs.google.com/spreadsheets/u/0/create)
  * Tools > Script Editor
    * copy/replace code
        * e.g., `Code.gs`, `appsscript.json`, etc.
    * Optional (for creating and publishing an add-on)
        * Associate with a GCP project: Resources > Cloud Platform project
        * [Configure Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
        * Publish > Deploy as Sheets Add-On
  * Switch back to the (container) Sheets
    * rename the sheet to your project_id
    * Select the "Sheets2GCE" menu item to the right of "Help"
        * "Import from GCE"
        * Authenticate with OAuth Consent Screen
            * click Continue
            * Select the Google Identity that you would like to use for authentication
            * click Allow
        * Repeat once again
    * Edit a label (e.g., `cost_center`)
    * Note the new "Logs" sheet with a new entry on the change
    * Verify in the GCP Console UI that the label for the instance changed
