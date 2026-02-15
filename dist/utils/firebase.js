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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminInstance = exports.FieldValue = exports.Timestamp = exports.auth = exports.firestore = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase
const path_1 = __importDefault(require("path"));
// Resolve service account path relative to project root
const credPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const resolvedCredPath = path_1.default.isAbsolute(credPath)
    ? credPath
    : path_1.default.resolve(process.cwd(), credPath);
console.log('🔥 Initializing Firebase with project:', process.env.FIREBASE_PROJECT_ID);
console.log('📂 Credentials path:', resolvedCredPath);
let serviceAccount;
try {
    serviceAccount = require(resolvedCredPath);
}
catch (error) {
    console.error('❌ Failed to load Firebase credentials from:', resolvedCredPath);
    throw error;
}
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
exports.firestore = admin.firestore();
exports.auth = admin.auth();
exports.Timestamp = admin.firestore.Timestamp;
exports.FieldValue = admin.firestore.FieldValue;
exports.adminInstance = admin;
