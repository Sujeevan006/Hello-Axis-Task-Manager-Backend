require('dotenv').config();

('use strict');

var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const dotenv_1 = __importDefault(require('dotenv'));
dotenv_1.default.config();

// DEBUG: Check if environment variables are loaded
console.log('=== Environment Variables Check ===');
console.log(
  'FIREBASE_PROJECT_ID:',
  process.env.FIREBASE_PROJECT_ID || 'NOT FOUND',
);
console.log(
  'GOOGLE_APPLICATION_CREDENTIALS:',
  process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT FOUND',
);
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('===================================');

const app_1 = __importDefault(require('./app'));
const seed_1 = require('./utils/seed');
const PORT = process.env.PORT || 5000;

// Set Google Application Credentials path explicitly
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log(
    'Setting GOOGLE_APPLICATION_CREDENTIALS:',
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

// Start server
app_1.default.listen(PORT, () =>
  __awaiter(void 0, void 0, void 0, function* () {
    console.log(`✅ Server running on port ${PORT}`);
    // Temporarily disabled seeding
    // yield (0, seed_1.seedAdmin)();
  }),
);
