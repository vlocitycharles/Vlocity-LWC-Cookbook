import { LightningElement, api } from 'lwc';

import callIP from '@salesforce/apex/ipLWCWrapper.callIP';


export default class IpLister extends LightningElement {
	@api prop1 ="";
	@api prop2 = false;
	@api recordId;

	ipResult = '';

	connectedCallback() {
		callIP({ ipName: 'lwc_getAccount', input: '{ "recordId": "0015w000029ZeYRAA0"}', options: '{}' })
		.then((result) => {
			this.ipResult = 'Success: ' + JSON.stringify(result);
		})
		.catch((error) => {
			this.ipResult = 'Error: ' + JSON.stringify(error);
		})
	}
}