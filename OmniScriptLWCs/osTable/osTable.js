/**
 * Generic Table and "Selectable Items" Lightning Web Component for OmniScript
 * 
 * This works by being pointed at an input element in the OmniScript data JSON
 * and being configured as to how to present the data from that element.
 * 
 * If selection is enabled, then the value of this element will be the subset
 * of elements which have been selected (including all non-displayed values).
 * 
 * This can also be configured to periodically check for changes in the source
 * data and refresh the table.  That's useful in situations where the data might
 * change because of a user action (such as triggering an Integration Procedure).
 * 
 * @author Kirk Leibert <kleibert@vlocity.com>
 * @author Charles McGuinness <cmcguinness@vlocity.com>
 * 
 */
import {
    LightningElement,
    track,
    api
} from 'lwc';

import {
    OmniscriptBaseMixin
} from 'vlocityins2/omniscriptBaseMixin';

export default class osTable extends OmniscriptBaseMixin(LightningElement) {

    @track data = {};
    @track vals = [];
    @track cols = [];
    @track headers = [];
    @track displayRows = [];
    @track title = '';
	@api multiselect;
    @api iconName = "standard:lead_list";

    input_data_json = '{}';
    @api 
    get source () {
        return "Hello";
    }
    set source (val) {
        // The setter is used to drive updates to the table, but there may be times when the
        // data is not yet present, and we want to avoid trying to generate a bad table...
        if (val === undefined || ! Array.isArray(val) || val.length === 0) {
            return;
        }
        this.input_data_json = JSON.stringify(val);
        this.logger(2,'Source New value: ' + this.input_data_json);
        this.generateData();
    }




	@track params_showSelect = true;
	params_update_frequency = 0;
    params_headers = null;
    params_values = null;
    params_input = null;


    /*  *****************************************************************   */
    /*  Debugging Code                                                      */
    /*  *****************************************************************   */

	// Indicate how deep of debugging we want:
	//		-1	Suffer in silence
    // 		 0 	Error messages
    //  	 1 	Warnings
	//  	 2 	Informational
    //		 3 	Spew (once per loop kind of messages)
    // Can change the level in code or via a parameter

    debug_name = 'osTable';
    debug_level = 0;
    debug_sentinel = '';		// Used to leave a last message before an error happens
    debug_element_name = '';

    logger(level, xobj) {
        if (level > this.debug_level) {
            return;
        }

        console.log(this.debug_name + '-'+ this.debug_element_name+': (' + this.debug_sentinel  + ') ' + String(xobj));

    }



    /*  *****************************************************************   */
    /*  Initialization Section of code                                      */
    /*  *****************************************************************   */


    /**
     * This method is called automatically when the LWC is ready to be
     * initialized.  It calls, in sequence, the methods used to create
     * both the data shown in the UI as well as backing data.
     */
    connectedCallback() {
        this.debug_element_name = this.omniJsonDef.propSetMap.label;
		this.title = this.omniJsonDef.propSetMap.label;
        this.parseParams();
        this.parseHeaders();
    }


    /**
     * Get the parameters for the LWC which have been pased in from the OmniScript as metadata
     * The parameters are passed in the definition of the element, and are held in an unordered
     * array called customAttributes.  Each element of the array is an object which has a key:value
     * pair.  The key is called "name", while the value is called "source".
     * 
     * We loop through the array, comparing the name to things we're looking for and, when matched,
     * saving the value into a module level variable for reference elsewhere.  Our comparisons are
	 * case INsensitive, because why be that fussy?
	 * 
	 * In future, should probably find a way to make this more table driven...
     */

    parseParams() {

		// This is appropriate for the keywords we use, but not a good generic comparator, FYI
		function stricmp(a,b) {
			return a.toUpperCase() === b.toUpperCase();
		}

        let params = this.omniJsonDef.propSetMap.customAttributes;

        //  Find the values in the list (don't want to be fussy about the order)
        params.forEach((val) => {
            if (stricmp(val.name,"headers")) {
                this.params_headers = val.source;
                this.logger(2,'Headers = ' + this.params_headers);
            }

            if (stricmp(val.name,'values')) {
                this.params_values = val.source;
                this.logger(2,'Values = ' + this.params_values);
            }

            if (stricmp(val.name,'debug')) {
                // eslint-disable-next-line radix
                this.debug_level = Math.max(this.debug_level, parseInt(val.source));    // Highest level wins
                this.logger(2,'Debug Level = ' + val.source);
            }

            if (stricmp(val.name,'select')) {
                // Note that select defaults to true
                let s = val.source.toUpperCase();
                if (s === 'F' || s === 'FALSE' || s === 'N' || s === "NO" || s==="NEIN" || s==="NON") {		// Why not?
                    this.params_showSelect = false;
                }
                this.logger(2,'Select = ' + String(this.params_showSelect));
            }


        });

    }

    /**
     * Retrieve the titles (headers) of the columns.  
     * 
     * We expect the custom parameter "headers" to hold the titles in a simple
     * comma-separated list.  We're assuming that the headers are literals,
	 * and not references to some other source...
     */

    parseHeaders() {
        (this.params_headers.split(',')).forEach((item, i) => {
            var x = {};
            x.key = i;
            x.value = item.trim(); // Don't want leading / trailing spaces
            this.headers.push(x);
        });
        this.logger(2,'Headers: ' + JSON.stringify(this.headers));
    }

    /**
     * Generates the data portion of the table
     */
    generateData() {

        this.logger(2, 'Entering generateData()');

		//	This is an area where easy misconfiguration can cause a problem, so
		//	we should be a bit helpful if we throw an error.

        try {
            //  Get the names of the values to display
            let values_list = this.params_values.split(',');
            this.debug_sentinel = 'Got values list';

            // This has the effect of making a deep copy
            let tempRows = JSON.parse(this.input_data_json);

            this.debug_sentinel = 'Got Temp Rows';

            if (tempRows === undefined || !Array.isArray(tempRows) || tempRows.length === 0) {
                this.logger(2, 'Exiting generateData(), no data');
                return;                         // No data yet...
            }

            this.debug_sentinel = 'Before forEach';

            this.displayRows = [];

            tempRows.forEach((item, i) => {
                this.debug_sentinel = 'In foreach';

                // console.log(item);
                // console.log("cb_" + String(i));
                item.tagname = "cb_" + String(i);
                item.rowid = i;
                item.checked = false;
                item.filtered = false;
                item.columns = [];
                values_list.forEach((name, i2) => {
                    let c = {}
                    c.key = i2;
                    c.value = item[name];
                    item.columns.push(c);
                });
                this.displayRows.push(item);
            });

            // //console.log(JSON.stringify(this.cols));
            this.debug_sentinel = 'After forEach';
            this.logger(3,'Display Rows: ');
            this.logger(3,JSON.stringify(this.displayRows));
        } catch (e) {
            this.logger(0,'Error in generate data:');
            this.logger(0,e.message);
        }
    }


    /*  *****************************************************************   */
    /*  Runtime rendering and selection										*/
    /*  *****************************************************************   */

    selectRow(event) {
        const selected = event.target.checked;
        const target = event.target.name;
        // eslint-disable-next-line radix
        const iteration = parseInt(target.substring(3, target.length));
        this.displayRows[iteration].checked = selected;
    }

    getRows() {
        let data = [];
        let filtered = [];
        data = this.displayRows;
        filtered = data.filter(function (item) {
            return item.checked === true;
        });
        return filtered;
    }

    handleSelection(event) {
        this.selectRow(event);
        this.omniUpdateDataJson(this.getRows());
    }
}