public with sharing class ipLWCWrapper {
    @AuraEnabled(cacheable=true)
    public static String callIP(String ipName, String input, String options) {
        System.debug(ipName);
        System.debug(input);
        System.debug(options);
        
        Map<String,Object> oInput = (Map<String,Object>) JSON.deserializeUntyped(input);
        Map<String,Object> oOptions = (Map<String,Object>) JSON.deserializeUntyped(options);
        Object oOutput = vlocityins2.IntegrationProcedureService.runIntegrationService(ipName, oInput, oOptions);
        return (String) JSON.serialize(oOutput);
    }
}
