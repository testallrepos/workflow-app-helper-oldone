import * as core from '@actions/core';
import { parseInputs } from './inputs';
import * as policyService from './services/policy-service';
import * as pipelineResultsService from './services/pipeline-results-service';
import * as policyResultsService from './services/policy-results-services';

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
 
  const inputs = parseInputs(core.getInput);
// core.info("ONE ONE ",inputs);
  switch (inputs.action) {
    case 'getPolicyNameByProfileName':
      await policyService.getPolicyNameByProfileName(inputs);
      break;
    case 'preparePipelineResults': {
       core.info(`inputs.action ${inputs.action}, inputs.action`);
      await pipelineResultsService.preparePipelineResults(inputs);
      break;
    }
    case 'preparePolicyResults':
      await policyResultsService.preparePolicyResults(inputs);
      break;
    default:
      core.setFailed(
        `Invalid action: ${inputs.action}. Allowed actions are: getPolicyNameByProfileName, preparePipelineResults, preparePolicyResults.`,
      );
  }
}
