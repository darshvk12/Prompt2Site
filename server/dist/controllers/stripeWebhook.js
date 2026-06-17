"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const stripeWebhook = async (request, response) => {
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
        }
        catch (err) {
            console.log(`⚠️ Webhook signature verification failed.`, err.message);
            return response.sendStatus(400);
        }
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                });
                const session = sessionList.data[0];
                const { transactionId, appId } = session.metadata;
                if (appId === 'SiteBuilder' && transactionId) {
                    const transaction = await prisma_1.default.transaction.update({
                        where: { id: transactionId },
                        data: { isPaid: true }
                    });
                    // Add the credits to the user data
                    await prisma_1.default.user.update({
                        where: { id: transaction.userId },
                        data: { credits: { increment: transaction.credits } }
                    });
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        // Return a response to acknowledge receipt of the event
        response.json({ received: true });
    }
};
exports.stripeWebhook = stripeWebhook;
