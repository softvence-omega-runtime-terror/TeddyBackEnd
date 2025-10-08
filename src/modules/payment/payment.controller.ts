import catchAsync from "../../util/catchAsync";
import { Request, Response } from "express";
import { stripe } from "../../config";
import paymentServices from "./payment.service";


// Create Stripe Checkout Session
const createCheckout = catchAsync(async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const { planId } = req.body;
        const successUrl = `${process.env.FRONTEND_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.FRONTEND_URL}/purchase-cancel`;

        const session = await paymentServices.createCheckoutSession({
            user,
            planId,
            successUrl,
            cancelUrl
        });

        res.json({ url: session.url, id: session.id });
    } catch (err: any) {
        console.error("createCheckout error:", err.message);
        return res.status(400).json({ message: err.message });
    }
});


// Handle Stripe Webhook
const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
    console.log("🎯 Webhook endpoint hit - /api/webhook");
    
    const sig = req.headers["stripe-signature"] as string;
    console.log("📋 Stripe signature present:", !!sig);
    
    if (!sig) {
        console.error("❌ No Stripe signature found in headers");
        return res.status(400).send("Missing Stripe signature");
    }

    let event;

    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        console.log("🔑 Webhook secret configured:", !!webhookSecret);
        console.log("🔑 Webhook secret length:", webhookSecret?.length || 0);
        
        if (!webhookSecret) {
            throw new Error("STRIPE_WEBHOOK_SECRET not configured");
        }
        
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );

        console.log("✅ Webhook signature verified, processing event:", event.type);
        console.log("📦 Event ID:", event.id);
        
        const result = await paymentServices.handleStripeWebhook(event);
        
        // Send success response to Stripe
        console.log("✅ Webhook processed successfully");
        res.status(200).json(result);
    } catch (err: any) {
        console.error("❌ Webhook processing error:", err.message);
        console.error("❌ Error stack:", err.stack);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});


// Verify Payment
const verifyPayment = catchAsync(async (req: Request, res: Response) => {
    try {
        const { session_id } = req.query;
        if (!session_id || typeof session_id !== 'string') {
            return res.status(400).json({ message: 'Missing or invalid session_id' });
        };

        const result = await paymentServices.verifyPayment(session_id);
        res.status(200).json({
            result
        });

    } catch (error: any) {

        res.status(400).json({
            success: false,
            message: error.message || 'Payment verification failed'
        });
    }
});



const paymentController = {
    createCheckout,
    stripeWebhook,
    verifyPayment
};

export default paymentController;