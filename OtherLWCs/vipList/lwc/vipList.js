/**
 * VipList
 * 
 * Generate a card with a list using data from a Vlocity Integration Procedure
 * 
 * This is meant to demonstrate how a non-Vlocity LWC (i.e., one that is not
 * in an OmniScript or Cards or ...) can make use of the Vlocity platform.
 * In this demo, we see how you can use a Vlocity Integration Procedure to
 * source data for a LWC.
 * 
 * Apart from that, this LWC does a couple interesting things to try to be
 * a bit useful, although it is not intended for deployment into production
 * as-is.  (For one thing, there is not a lot of error checking, so if things
 * go wrong, the user is going to get to see interesting error messages!)
 * 
 * @author Charles McGuinness <cmcguinness@vlocity.com>
 * 
 */
import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import callIP from '@salesforce/apex/ipLWCWrapper.callIP';


export default class VipList extends NavigationMixin(LightningElement) {

	/*	*******************************************************************	*/
	/*	Our "API" properties.  These are mapped in the .js-meta.xml file	*/
	/*	*******************************************************************	*/

	@api pathToData ="";
	@api recordId;
	@api titles = "";
	@api names = "";
	@api ipname = "";
	@api iconName = "standard:lead_list";
	@api listTitle = "";
	@api idField = "";
	@api linkField = "";

	/*	*******************************************************************	*/
	/*	What is used to generate the user interface...						*/
	/*	*******************************************************************	*/
	@track ipResult = '';
	@track rows = [];
	@track headers = [];

	/*	*******************************************************************	*/
	/*	This is the primary routine for generating the UI					*/
	/*	*******************************************************************	*/

	connectedCallback() {

		//	Integration procedures take three inputs:
		//		Map<String,Object> inputs		// In which we pass in the record id
		//		Map<String,Object> options		// which we do not use
		//
		let sInput =  '{ "recordId": "' + this.recordId +'"}';
		// console.log("Input: " + sInput);		// Debug

		//	This doesn't call an integration procedure directly, but calls our
		//	proxy apex class which calls the integration procedure.  We need
		//	to tell the proxy which integration procedure to run (ipName), what
		//	the inputs are (input) and what the options are (options).
		//
		//	You'll note that I pass everything in as strings.  I'm not sure it's
		//	strictly necessary, but I got this working and "if it ain't broke ..."
		callIP({ ipName: this.ipname, input: sInput, options: '{}' })
		.then((result) => {

			//	~~~ Time passes ~~~ and then we're in here assuming all is well!

			// console.log(typeof(result));
			// console.log('Success: ' + JSON.stringify(result));

			// The output is a serialized JSON object, so let's deserialize it...
			let parsedData = JSON.parse(result);

			// One little bit of error checking...
			try {
				// Find the top level object that has the array of data we want to
				// work with.  Note that this code doesn't allow for a a.b.c kind
				// of deep path, although it probably should at some point.  I
				// do have code for that somewhere...
				parsedData = parsedData[this.pathToData];
			} catch (e) {
				this.ipResult = "Unable to find data at " + this.pathToData;
				console.log(this.ipResult);
				return;
			}

			// If one row of data is returned, then it looks like an object, while if
			// multiple rows come back, it looks like an array of objects.  So if we
			// have just one row, let's put it into an array so the rest of the code
			// can assume it's all an array...
			if (Array.isArray(parsedData)) {
				// do nothing
			} else {
				parsedData = [ parsedData ];
			}

			// console.log("Rows: " + JSON.stringify(parsedData));

			//	Remember, the column headers are specified by a text string the user enters
			//	when configuring the LWC, so we use the split function to break it
			//	into an array of headers
			let arrayTitles = this.titles.split(',');

			// Generate the headers to display in the page.  This code is a bit complicated
			// because you can't just feed the UI an array of strings; it needs an array
			// of objects where one element is a unique identifier and the other element is
			// the string, so we have to do this hocum here...
			arrayTitles.forEach((k, i) => {
				// console.log("Title: " + k);
				this.headers.push({ key : i, value: k.trim()});
			})

			//	Now that the column headers have been generated, we have to generate the
			//	rows of data.  Step one is to figure out which fields -- in what order --
			//	need to be present in the UI.  Like the list of column headers, the list
			//	of field names is in a sort of CSV format so we start by breaking it apart
			let arrayNames = this.names.split(',');


			// Now generate the rows of data.  What we'll do is loop over the elements in
			// the array we got back from the VIP.  Each element is a key:value object with
			// the invidual fields.  Since we're only interested in the fields the admin
			// has configured, we loop not over the keys, but over the field names we just
			// split, and pull out the data item specified, in the proper order...
			// There's also some magic for dealing with hyperlinks discussed below.
			parsedData.forEach((row, i) => {
				let rowdata = [];
				arrayNames.forEach((k,j) => {
					k = k.trim();

					// In order to handle hyperlinks, we have to take one of the columns
					// and give it an <a> tag.  The way we do that is to add additional
					// data to the columns that indicate if they're the link field or not
					// and then, in the HTML, do some conditional inclusions.  This
					// code figures out if this is the magic column and, if so, includes
					// the record id into the background of the column so we can use it
					// when the end user clicks on it.
					let isLinkField = (k === this.linkField);
					let linkId = "";

					if (this.idField !== "") {
						linkId = row[this.idField];
					}
					// console.log("key: " + k + ", value: "+row[k]);
					rowdata.push({key : j, value: row[k], linkfield: isLinkField, linkid: linkId});
				});
				this.rows.push({ key: i, value: rowdata});
			});
		})
		.catch((error) => {
			this.ipResult = 'Error: ' + JSON.stringify(error);
			console.log(this.ipResult);
		})
	}

	/**
	 * The handler that is called when the user clicks on a record.
	 * 
	 * It pulls the record id out of the event and then uses lightning navigation
	 * to take us to the record page for the id.
	 * 
	 * @param {*} event 
	 */
	clicky(event) {
		// console.log('Click!');
		// console.log(event.target.name);

		this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.target.name,
                actionName: 'view',
            },
        });
    }
}