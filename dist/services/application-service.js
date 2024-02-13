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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationByName = void 0;
const core = __importStar(require("@actions/core"));
const app_config_1 = __importDefault(require("../app-config"));
const http = __importStar(require("../api/http-request"));
async function getApplicationByName(appname, vid, vkey) {
    var _a;
    try {
        const getApplicationByNameResource = {
            resourceUri: app_config_1.default.applicationUri,
            queryAttribute: 'name',
            queryValue: encodeURIComponent(appname),
        };
        const applicationResponse = await http.getResourceByAttribute(vid, vkey, getApplicationByNameResource);
        const applications = ((_a = applicationResponse._embedded) === null || _a === void 0 ? void 0 : _a.applications) || [];
        if (applications.length === 0) {
            throw new Error(`No application found with name ${appname}`);
        }
        else if (applications.length > 1) {
            core.info(`Multiple applications found with name ${appname}, selecting the first found`);
        }
        return applications[0];
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}
exports.getApplicationByName = getApplicationByName;
