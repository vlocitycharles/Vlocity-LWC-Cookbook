import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import callIP from '@salesforce/apex/ipLWCWrapper.callIP';


export default class VipList extends NavigationMixin(LightningElement) {
	@api pathToData ="";
	@api recordId;
	@api titles = "";
	@api names = "";
	@api ipname = "";
	@api iconName = "standard:lead_list";
	@api listTitle = "";
	@api idField = "";
	@api linkField = "";

	@track ipResult = '';
	@track rows = [];
	@track headers = [];

	connectedCallback() {
		let sInput =  '{ "recordId": "' + this.recordId +'"}';
		console.log("Input: " + sInput);
		callIP({ ipName: this.ipname, input: sInput, options: '{}' })
		.then((result) => {
			console.log(typeof(result));
			console.log('Success: ' + JSON.stringify(result));
			let parsedData = JSON.parse(result);

			try {
			parsedData = parsedData[this.pathToData];
			} catch (e) {
				this.ipResult = "Unable to find data";
				return;
			}

			// Handle singleton vs array data
			if (Array.isArray(parsedData)) {
				// do nothing
			} else {
				parsedData = [ parsedData ];
			}

			console.log("Rows: " + JSON.stringify(parsedData));

			let arrayTitles = this.titles.split(',');

			// Generate the headers to display in the page
			arrayTitles.forEach((k, i) => {
				// console.log("Title: " + k);
				this.headers.push({ key : i, value: k.trim()});
			})

			let arrayNames = this.names.split(',');
			// Now generate the rows of data
			parsedData.forEach((row, i) => {
				let rowdata = [];
				arrayNames.forEach((k,j) => {
					k = k.trim();
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

	clicky(event) {
		console.log('Click!');
		console.log(event.target.name);

		this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.target.name,
                actionName: 'view',
            },
        });
    }
}