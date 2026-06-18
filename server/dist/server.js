"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const node_1 = require("better-auth/node");
const auth_1 = require("./lib/auth");
const UserRoutes_js_1 = __importDefault(require("./routes/UserRoutes.js"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const stripeWebhook_js_1 = require("./controllers/stripeWebhook.js");
const app = (0, express_1.default)();
const port = 3000;
const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.post('/api/stripe', express_1.default.raw({ type: 'application/json' }), stripeWebhook_js_1.stripeWebhook);
app.use('/api/auth', (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json({ limit: '50mb' }));
app.use('/api/user', UserRoutes_js_1.default);
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.use('/api/user', UserRoutes_js_1.default);
app.use('/api/project', projectRoutes_1.default);
app.use('/api/user', UserRoutes_js_1.default);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
