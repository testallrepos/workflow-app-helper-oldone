"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChecks = void 0;
async function updateChecks(octokit, checksStatic, conclusion, annotations, summary) {
    const data = {
        owner: checksStatic.owner,
        repo: checksStatic.repo,
        check_run_id: checksStatic.check_run_id,
        status: checksStatic.status,
        conclusion: conclusion,
        output: {
            annotations: annotations,
            title: 'Veracode Static Code Analysis',
            summary: summary,
        },
    };
    await octokit.checks.update(data);
}
exports.updateChecks = updateChecks;
