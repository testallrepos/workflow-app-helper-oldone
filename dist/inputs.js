"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaildateScanResultsActionInput = exports.parseInputs = exports.Actions = void 0;
var Actions;
(function (Actions) {
    Actions["GetPolicyNameByProfileName"] = "getPolicyNameByProfileName";
    Actions["PreparePipelineResults"] = "preparePipelineResults";
    Actions["PreparePolicyResults"] = "preparePolicyResults";
})(Actions || (exports.Actions = Actions = {}));
const parseInputs = (getInput) => {
    const action = getInput('action', { required: true });
    if (!Object.values(Actions).includes(action)) {
        throw new Error(`Invalid action: ${action}. It must be one of '${Object.values(Actions).join('\' or \'')}'.`);
    }
    const vid = getInput('vid', { required: true });
    const vkey = getInput('vkey', { required: true });
    const appname = getInput('appname', { required: true });
    const token = getInput('token');
    const check_run_id = getInput('check_run_id');
    const source_repository = getInput('source_repository');
    const fail_checks_on_policy = getInput('fail_checks_on_policy') === 'true';
    const fail_checks_on_error = getInput('fail_checks_on_error') === 'true';
    if (source_repository && source_repository.split('/').length !== 2) {
        throw new Error('source_repository needs to be in the {owner}/{repo} format');
    }
    return { action, token, check_run_id: +check_run_id, vid, vkey, appname,
        source_repository, fail_checks_on_policy, fail_checks_on_error };
};
exports.parseInputs = parseInputs;
const vaildateScanResultsActionInput = (inputs) => {
    console.log(inputs);
    if (!inputs.token || !inputs.check_run_id || !inputs.source_repository) {
        return false;
    }
    return true;
};
exports.vaildateScanResultsActionInput = vaildateScanResultsActionInput;
