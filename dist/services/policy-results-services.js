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
exports.preparePolicyResults = void 0;
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const fs = __importStar(require("fs/promises"));
const inputs_1 = require("../inputs");
const Checks = __importStar(require("../namespaces/Checks"));
const check_service_1 = require("./check-service");
async function preparePolicyResults(inputs) {
    const octokit = new rest_1.Octokit({
        auth: inputs.token,
    });
    const repo = inputs.source_repository.split('/');
    const ownership = {
        owner: repo[0],
        repo: repo[1],
    };
    const checkStatic = {
        owner: ownership.owner,
        repo: ownership.repo,
        check_run_id: inputs.check_run_id,
        status: Checks.Status.Completed,
    };
    if (!(0, inputs_1.vaildateScanResultsActionInput)(inputs)) {
        core.setFailed('token, check_run_id and source_repository are required.');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, inputs.fail_checks_on_error ? Checks.Conclusion.Failure : Checks.Conclusion.Success, [], 'Token, check_run_id and source_repository are required.');
        return;
    }
    let findingsArray = [];
    let resultsUrl = '';
    try {
        const data = await fs.readFile('policy_flaws.json', 'utf-8');
        const parsedData = JSON.parse(data);
        findingsArray = parsedData._embedded.findings;
        resultsUrl = await fs.readFile('results_url.txt', 'utf-8');
    }
    catch (error) {
        core.debug(`Error reading or parsing filtered_results.json:${error}`);
        core.setFailed('Error reading or parsing pipeline scan results.');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, inputs.fail_checks_on_error ? Checks.Conclusion.Failure : Checks.Conclusion.Success, [], 'Error reading or parsing pipeline scan results.');
        return;
    }
    core.info(`Policy findings: ${findingsArray.length}`);
    core.info(`Results URL: ${resultsUrl}`);
    if (findingsArray.length === 0) {
        core.info('No findings violates the policy, exiting and update the github check status to success');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, Checks.Conclusion.Success, [], 'No policy violated findings');
        return;
    }
    else {
        core.info('Findings violate the policy, exiting and update the github check status to failure');
        const repoResponse = await octokit.repos.get(ownership);
        const language = repoResponse.data.language;
        core.info(`Source repository language: ${language}`);
        let javaMaven = false;
        if (language === 'Java') {
            let pomFileExists = false;
            let gradleFileExists = false;
            try {
                await octokit.repos.getContent(Object.assign(Object.assign({}, ownership), { path: 'pom.xml' }));
                pomFileExists = true;
            }
            catch (error) {
                core.debug(`Error reading or parsing source repository:${error}`);
            }
            try {
                await octokit.repos.getContent(Object.assign(Object.assign({}, ownership), { path: 'build.gradle' }));
                gradleFileExists = true;
            }
            catch (error) {
                core.debug(`Error reading or parsing source repository:${error}`);
            }
            if (pomFileExists || gradleFileExists)
                javaMaven = true;
        }
        const annotations = getAnnotations(findingsArray, javaMaven);
        const maxNumberOfAnnotations = 50;
        for (let index = 0; index < annotations.length / maxNumberOfAnnotations; index++) {
            const annotationBatch = annotations.slice(index * maxNumberOfAnnotations, (index + 1) * maxNumberOfAnnotations);
            if (annotationBatch.length > 0) {
                await (0, check_service_1.updateChecks)(octokit, checkStatic, inputs.fail_checks_on_policy ? Checks.Conclusion.Failure : Checks.Conclusion.Success, annotationBatch, `Here's the summary of the check result, the full report can be found [here](${resultsUrl}).`);
            }
        }
        return;
    }
}
exports.preparePolicyResults = preparePolicyResults;
function getAnnotations(policyFindings, javaMaven) {
    const annotations = [];
    policyFindings.forEach(function (element) {
        if (javaMaven) {
            element.finding_details.file_path = `src/main/java/${element.finding_details.file_path}`;
            if (element.finding_details.file_path.includes('WEB-INF'))
                element.finding_details.file_path = element.finding_details.file_path.replace(/src\/main\/java\//, 'src/main/webapp/');
        }
        const displayMessage = element.description.replace(/<span>/g, '').replace(/<\/span> /g, '\n').replace(/<\/span>/g, '');
        let filePath = element.finding_details.file_path;
        if (filePath.startsWith('/'))
            filePath = filePath.substring(1);
        const message = `Filename: ${filePath}\nLine: ${element.finding_details.file_line_number}\nCWE: ${element.finding_details.cwe.id} (${element.finding_details.cwe.name})\n\n${displayMessage}`;
        annotations.push({
            path: `${filePath}`,
            start_line: element.finding_details.file_line_number,
            end_line: element.finding_details.file_line_number,
            annotation_level: 'warning',
            title: element.finding_details.cwe.name,
            message: message,
        });
    });
    return annotations;
}
