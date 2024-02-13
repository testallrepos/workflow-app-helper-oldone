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
exports.preparePipelineResults = void 0;
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const fs = __importStar(require("fs/promises"));
const Checks = __importStar(require("../namespaces/Checks"));
const inputs_1 = require("../inputs");
const check_service_1 = require("./check-service");
const application_service_1 = require("./application-service");
const findings_service_1 = require("./findings-service");
const LINE_NUMBER_SLOP = 3;
async function preparePipelineResults(inputs) {
    core.info(`pipeline-results-service.ts ${inputs}, pipeline-results-service.ts`);
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
    const octokit = new rest_1.Octokit({
        auth: inputs.token,
    });
    if (!(0, inputs_1.vaildateScanResultsActionInput)(inputs)) {
        core.setFailed('token, check_run_id and source_repository are required.');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, inputs.fail_checks_on_error ? Checks.Conclusion.Failure : Checks.Conclusion.Success, [], 'Token, check_run_id and source_repository are required.');
        return;
    }
    let findingsArray = [];
    try {
        const data = await fs.readFile('filtered_results.json', 'utf-8');
        const parsedData = JSON.parse(data);
        findingsArray = parsedData.findings;
    }
    catch (error) {
        core.debug(`Error reading or parsing filtered_results.json:${error}`);
        core.setFailed('Error reading or parsing pipeline scan results.');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, inputs.fail_checks_on_error ? Checks.Conclusion.Failure : Checks.Conclusion.Success, [], 'Error reading or parsing pipeline scan results.');
        return;
    }
    core.info(`Pipeline findings: ${findingsArray.length}`);
    if (findingsArray.length === 0) {
        core.info('No pipeline findings, exiting and update the github check status to success');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, Checks.Conclusion.Success, [], 'No pipeline findings');
        return;
    }
    let policyFindings = [];
    try {
        core.info(`inputs.appname inputs.appname ${inputs.appname}`);
        const application = await (0, application_service_1.getApplicationByName)(inputs.appname, inputs.vid, inputs.vkey);
        const applicationGuid = application.guid;
        core.info(`applicationGuid applicationGuid ${applicationGuid}`);
        policyFindings = await (0, findings_service_1.getApplicationFindings)(applicationGuid, inputs.vid, inputs.vkey);
    }
    catch (error) {
        core.info(`error. error error ${error}`);
        core.info(`No application found with name ${inputs.appname}`);
        policyFindings = [];
    }
    core.info(`Policy findings: ${policyFindings.length}`);
    const mitigatedPolicyFindings = policyFindings.filter((finding) => {
        return (finding.violates_policy === true &&
            finding.finding_status.status === 'CLOSED' &&
            (finding.finding_status.resolution === 'POTENTIAL_FALSE_POSITIVE' ||
                finding.finding_status.resolution === 'MITIGATED') &&
            finding.finding_status.resolution_status === 'APPROVED');
    });
    core.info(`Mitigated policy findings: ${mitigatedPolicyFindings.length}`);
    const filteredFindingsArray = findingsArray.filter((finding) => {
        return !mitigatedPolicyFindings.some((mitigatedFinding) => {
            return (finding.files.source_file.file === mitigatedFinding.finding_details.file_path &&
                +finding.cwe_id === mitigatedFinding.finding_details.cwe.id &&
                Math.abs(finding.files.source_file.line - mitigatedFinding.finding_details.file_line_number) <= LINE_NUMBER_SLOP);
        });
    });
    core.info(`Filtered pipeline findings: ${filteredFindingsArray.length}`);
    if (filteredFindingsArray.length === 0) {
        core.info('No pipeline findings after filtering, exiting and update the github check status to success');
        await (0, check_service_1.updateChecks)(octokit, checkStatic, Checks.Conclusion.Success, [], 'No pipeline findings');
        return;
    }
    else {
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
        core.info('Pipeline findings after filtering, continue to update the github check status');
        const annotations = getAnnotations(filteredFindingsArray, javaMaven);
        const maxNumberOfAnnotations = 50;
        for (let index = 0; index < annotations.length / maxNumberOfAnnotations; index++) {
            const annotationBatch = annotations.slice(index * maxNumberOfAnnotations, (index + 1) * maxNumberOfAnnotations);
            if (annotationBatch.length > 0) {
                await (0, check_service_1.updateChecks)(octokit, checkStatic, inputs.fail_checks_on_policy ? Checks.Conclusion.Failure : Checks.Conclusion.Success, annotationBatch, 'Here\'s the summary of the scan result.');
            }
        }
    }
}
exports.preparePipelineResults = preparePipelineResults;
function getAnnotations(pipelineFindings, javaMaven) {
    const annotations = [];
    pipelineFindings.forEach(function (element) {
        if (javaMaven) {
            element.files.source_file.file = `src/main/java/${element.files.source_file.file}`;
            if (element.files.source_file.file.includes('WEB-INF'))
                element.files.source_file.file = element.files.source_file.file.replace(/src\/main\/java\//, 'src/main/webapp/');
        }
        const displayMessage = element.display_text
            .replace(/<span>/g, '')
            .replace(/<\/span> /g, '\n')
            .replace(/<\/span>/g, '');
        const message = `Filename: ${element.files.source_file.file}\n` +
            `Line: ${element.files.source_file.line}\n` +
            `CWE: ${element.cwe_id} (${element.issue_type})\n\n${displayMessage}`;
        annotations.push({
            path: `${element.files.source_file.file}`,
            start_line: element.files.source_file.line,
            end_line: element.files.source_file.line,
            annotation_level: 'warning',
            title: element.issue_type,
            message: message,
        });
    });
    return annotations;
}
