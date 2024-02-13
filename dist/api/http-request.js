"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceByAttribute = void 0;
const veracode_hmac_1 = require("./veracode-hmac");
const app_config_1 = __importDefault(require("../app-config"));
async function getResourceByAttribute(vid, vkey, resource) {
    const resourceUri = resource.resourceUri;
    const queryAttribute = resource.queryAttribute;
    const queryValue = resource.queryValue;
    const urlQueryParams = queryAttribute !== '' ? `?${queryAttribute}=${queryValue}` : '';
    const queryUrl = resourceUri + urlQueryParams;
    const headers = {
        Authorization: (0, veracode_hmac_1.calculateAuthorizationHeader)({
            id: vid,
            key: vkey,
            host: app_config_1.default.hostName,
            url: queryUrl,
            method: 'GET',
        }),
    };
    const appUrl = `https://${app_config_1.default.hostName}${resourceUri}${urlQueryParams}`;
    try {
        const response = await fetch(appUrl, { headers });
        const data = await response.json();
        return data;
    }
    catch (error) {
        throw new Error('Failed to fetch resource.');
    }
}
exports.getResourceByAttribute = getResourceByAttribute;
