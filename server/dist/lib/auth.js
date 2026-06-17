"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
// If your Prisma file is located elsewhere, you can change the path
const prisma_js_1 = __importDefault(require("./prisma.js"));
const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',') || [];
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma_js_1.default, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        deleteUser: { enabled: true }
    },
    trustedOrigins,
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    advanced: {
        cookies: {
            session_token: {
                name: 'auth_session',
                attributes: {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                }
            }
        }
    }
});
