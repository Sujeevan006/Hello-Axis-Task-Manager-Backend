require('dotenv').config();

('use strict');
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const cors_1 = __importDefault(require('cors'));
const helmet_1 = __importDefault(require('helmet'));
const morgan_1 = __importDefault(require('morgan'));
const cookie_parser_1 = __importDefault(require('cookie-parser'));
const auth_routes_1 = __importDefault(require('./routes/auth.routes'));
const user_routes_1 = __importDefault(require('./routes/user.routes'));
const task_routes_1 = __importDefault(require('./routes/task.routes'));

// Firebase is already initialized in firebase.js - no need to initialize here
console.log('✅ App initialized');

const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.get('/', (req, res) => {
  res.send('Task Management API is running');
});

// EXPORT THE APP
exports.default = app;
