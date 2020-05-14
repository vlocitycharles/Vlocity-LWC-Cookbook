/**
 * OmniScript Charting LWC
 * 
 * This is a wrapper around ChartJS to allow you to embed charts inside
 * of an OmniScript.  It assumes that there is a static resource chartzip
 * that is a zip file which contains Chart.js and Chart.css.
 * 
 * Note that the data in the chart can be updated throughout the run of an
 * OmniScript, and so we will regenerate the chart when the data changes.
 * The data is passed to us in custom LWC properties via the %element%
 * syntax, and so we use @api setters to receive updates.
 * 
 * That creates some issues for us around timing, however, and there is logic
 * throughout to try to prevent updates from happening at the "wrong" time.
 * 
 * @author Charles McGuinness <cmcguinness@vlocity.com>
 * 
 */
import { LightningElement, track , api } from "lwc";

import { OmniscriptBaseMixin } from "vlocityins2/omniscriptBaseMixin";

import { loadScript, loadStyle } from "lightning/platformResourceLoader";

export default class OsCharting extends OmniscriptBaseMixin(LightningElement) {


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

    debug_name = 'osCharting';
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
    /*  Timing Control                                                      */
    /*  *****************************************************************   */

    // We cannot start to build our charts until the renderedCallback, so this
    // flag is used to shut down any premature attempts to draw a chart
    we_have_rendered = false;

    // The loading of chartjs happens async and slowly, so we want to only
    // bring it in once...
    chartjsInitialized = false;

    // Because we do some async things (i.e., loading the chartjs library)
    // we can get calls into us while we're waiting for that to complete.
    // This flag says "hold up, I'm waiting for something" otherwise we might
    // try to load the library multiple times...
    lockout = false;


    /*  ******************************************************************* */
    /*  APIs                                                                */
    /*  ******************************************************************* */

    //  In an OmniScript LWC, @APIs are used to pass in custom LWC parameters.
    //  When those parameters use the %element% syntax, they get called whenever
    //  the underlying data changes, which is handy because it allows us to
    //  redraw the chart.  To do that, we follow a pattern which is to use
    //  the setter to not just receive the new data but to trigger the re-drawing
    //  of the chart.

    //  First, the actual numerical data that drives the chart:
    source_data = [];

    //  A cached version of the data we can use to see if the data actually changed
    old_source_data_json = null;

    @api
    get source () {
        return this.source_data;
    }
    set source (val) {

        //  Note that we get null if there data is not yet present in the OS
        if (val === null) {
            this.logger(2, "Got null source data");
            return;     // Don't try to chart
        }
        this.source_data = val;

        // If we're already past the rendering callback, go ahead and update the chart
        if (this.we_have_rendered) {
            this.doChart();
        }
    }

    // Now the labels for the chart
    source_labels = [];

    // And a cached version to detect changes
    old_source_labels_json = null;
    @api
    get labels () {
        return this.source_labels;
    }
    set labels (val) {
        if (val === null) {
            this.logger(2, "Got null label data");
            return;
        }
        this.source_labels = val;
        if (this.we_have_rendered) {
            this.doChart();
        }
    }

    /*  ******************************************************************* */
    /*  Global Properties                                                   */
    /*  ******************************************************************* */


    // We use a basic card layout, and these are the title and icons we display
    // by default
    @track title = 'Chart';
    @track icon_name = 'custom:custom102';


    // A cached handle to the drawn chart, although we don't currently use it
    chart;

    // If specified, look for a specific property in the source data for the
    // labels and data. 
    params_data_element = '';
    params_label_element = '';


    /*  ******************************************************************* */
    /*  Chart Properties                                                    */
    /*  ******************************************************************* */


    //  Default to bar...
    params_chartType = 'bar';

    //  Default Charting Options
    params_options = {
        responsive: true,
        legend: {
            display: false
        },
        animation: {
            animateScale: true,
            animateRotate: true
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    };

    // Some default background colors that are sorta reasonable
    params_background = [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(157, 255, 166)',
        'rgb(244, 181, 255)',
        'rgb(160, 0, 0)',
        'rgb(0, 160, 0)',
        'rgb(0, 0, 160)'


    ];




    /*  *****************************************************************   */
    /*  Initialization Section of code                                      */
    /*  *****************************************************************   */


    // This is called when we're ready to go ... it will see if there's a custom label set
    connectedCallback() {

        // For debugging, reference purposes
        this.debug_element_name = this.omniJsonDef.propSetMap.label;
        this.title = this.omniJsonDef.propSetMap.label;

        this.parseParams();

    }

    /**
     * Does the % expansion of simple values, as the data in the definition
     * does not have that done.  Should migrate all to @api eventually
     * @param {*} name 
     */
    dereferenceData(name) {
        if (name.startsWith('%') && name.endsWith('%')) {
            return this.omniJsonData[name.substr(1, name.length - 2)];
        }
        return name;
    }

    derefernceAndSplit(name) {
        let value = this.dereferenceData(name);
        if (typeof (value) === "string") {
            if (value.includes(',')) {
                return value.split(',');
            }
            return [value];
        }
        return value;
    }

    /**
     * Get the parameters for the LWC which have been pased in from the OmniScript as metadata
     * The parameters are passed in the definition of the element, and are held in an unordered
     * array called customAttributes.  Each element of the array is an object which has a key:value
     * pair.  The key is called "name", while the value is called "source".
     * 
     * We loop through the array, comparing the name to things we're looking for and, when matched,
     * saving the value into a module level variable for reference elsewhere. 
     */

    parseParams() {

        let params = this.omniJsonDef.propSetMap.customAttributes;

        //  Find the values in the list (don't want to be fussy about the order)
        params.forEach((val) => {
            if (val.name.toUpperCase() === "CHARTTYPE") {
                this.params_chartType = this.dereferenceData(val.source);
            }

            if (val.name.toUpperCase() === "OPTIONS") {
                this.params_options = this.dereferenceData(val.source);
            }

            if (val.name.toUpperCase() === 'SOURCEELEMENT') {
                this.params_data_element = val.source;
                this.logger(2,"Source Element: " + val.source);
            }

            if (val.name.toUpperCase() === 'LABELELEMENT') {
                this.params_label_element = val.source;
                this.logger(2,"Label Element: " + val.source);
            }

            if (val.name.toUpperCase() ==='DEBUG') {
                // eslint-disable-next-line radix
                this.debug_level = Math.max(this.debug_level, parseInt(val.source));    // Highest level wins
                this.logger(2,'Debug Level = ' + val.source);
            }


        });

    }

    /*  *****************************************************************   */
    /*  Charting Logic                                                      */
    /*  *****************************************************************   */

    renderedCallback() {
        this.logger(2, "in renderedCallback");
        this.we_have_rendered = true;
        if (this.source_data !== null && this.source_labels !== null && this.source_data.length > 0 && this.source_labels.length > 0) {
            this.doChart();
        }
    }

    doChart() {
        this.logger(2,'In do chart');

        if (this.lockout) {
            this.logger(2, "Lockout");
            return;
        }

        if (this.chartjsInitialized) {
            this.drawchart();
            return;
        }
        this.lockout = true;

        this.chartjsInitialized = true;

        this.logger(2,'Creating a new chart');

        this.canvas = document.createElement('canvas');
        this.template.querySelector('div.chart').appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        let resourceUrl = "/resource/chartzip";
        Promise.all([
                loadScript(this, resourceUrl + "/Chart.js"),
                loadStyle(this, resourceUrl + "/Chart.css")
            ])
            .then(() => {
                // disable Chart.js CSS injection as needed by Salesforce
                window.Chart.platform.disableCSSInjection = true;
                this.drawchart();
                this.lockout = false;
            })
            .catch((error) => {
                this.error = error;
            });

    }

    getData(sourceData, elementName) {
        //  Make a copy...
        let fulldata = JSON.parse(JSON.stringify(sourceData));

        let thedata = [];
        if (elementName === '') {
            thedata = fulldata;
        } else {
            fulldata.forEach((x) => thedata.push(x[elementName]));
        }
        this.logger(3,thedata);

        return thedata;
    }

    drawchart() {

        let chart_data = this.getData(this.source_data, this.params_data_element);
        let chart_labels = this.getData(this.source_labels, this.params_label_element);

        // If nothing has changed, don't bother ...
        if ( (this.old_source_data_json === JSON.stringify(chart_data)) && (this.old_source_labels_json === JSON.stringify(chart_labels))) {
            return;
        }

        //  Cache the values for the next time
        this.old_source_data_json = JSON.stringify(chart_data);
        this.old_source_labels_json = JSON.stringify(chart_labels);

        try {
            let config = {
                type: this.params_chartType,
                data: {
                    datasets: [{
                        data: chart_data,
                        backgroundColor: this.params_background
                    }],
                    labels: chart_labels
                },
                options: this.params_options
            };


            this.chart = new window.Chart(this.ctx, config);
        } catch (err) {
           this.logger(0, err.message);
        }
    }
}