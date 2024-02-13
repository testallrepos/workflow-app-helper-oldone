"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const inputs_1 = require("./inputs");
const policyService = __importStar(require("./services/policy-service"));
const pipelineResultsService = __importStar(require("./services/pipeline-results-service"));
const policyResultsService = __importStar(require("./services/policy-results-services"));
async function run() {
    const inputs = (0, inputs_1.parseInputs)(core.getInput);
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
            core.setFailed(`Invalid action: ${inputs.action}. Allowed actions are: getPolicyNameByProfileName, preparePipelineResults, preparePolicyResults.`);
    }
}
exports.run = run;
