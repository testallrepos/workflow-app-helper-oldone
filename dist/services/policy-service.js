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
exports.getPolicyNameByProfileName = void 0;
const core = __importStar(require("@actions/core"));
const ApplicationService = __importStar(require("../services/application-service"));
async function getPolicyNameByProfileName(inputs) {
    const appname = inputs.appname;
    const vid = inputs.vid;
    const vkey = inputs.vkey;
    try {
        const application = await ApplicationService.getApplicationByName(appname, vid, vkey);
        core.setOutput('policy_name', application.profile.policies[0].name);
    }
    catch (error) {
        core.info(`No application found with name ${appname}`);
        core.setOutput('policy_name', '');
    }
}
exports.getPolicyNameByProfileName = getPolicyNameByProfileName;
