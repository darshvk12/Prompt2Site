"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_js_1 = require("../controllers/UserController.js");
const auth_js_1 = require("../middlewares/auth.js");
const userRouter = express_1.default.Router();
userRouter.get('/credits', auth_js_1.protect, UserController_js_1.getUserCredits);
userRouter.post('/project', auth_js_1.protect, UserController_js_1.createUserProject);
userRouter.get('/project/:projectId', auth_js_1.protect, UserController_js_1.getUserProject);
userRouter.get('/projects', auth_js_1.protect, UserController_js_1.getUserProjects);
userRouter.get('/publish-toggle/:projectId', auth_js_1.protect, UserController_js_1.togglePublish);
userRouter.post('/purchase-credits', auth_js_1.protect, UserController_js_1.purchaseCredits);
exports.default = userRouter;
