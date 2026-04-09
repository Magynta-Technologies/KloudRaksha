import Razorpay from "razorpay";
import { User } from "../models/schema.js";
import crypto from "crypto";
import { logEvent } from "./log-controller.js";
import { AuditActionType } from "../models/schema.js";

const razorpay = new Razorpay({
  key_id: "rzp_test_WthU3JJ2asFE9Z",
  key_secret: "ArEUdE8OCrsTrKgg4l8Ypovy",
});

export const orders = async (req, res) => {
  const { planId } = req.body; // Destructure planId from req.body
  const userId = res.locals.jwtData.id;

  try {
    const user = await User.findById(userId); // Pass userId directly
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
    });

    user.subscription = {
      planId,
      status: "created",
      subscriptionId: subscription.id,
    };
    await user.save();

    await logEvent(userId, AuditActionType.SUBSCRIPTION_CREATE, "Passed", {
      details: {
        planId,
        subscriptionId: subscription.id,
      },
    });

    res.json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "An error occurred while creating the subscription" });
  }
};

export const paymentVerification = async (req, res) => {
  const secret = "ArEUdE8OCrsTrKgg4l8Ypovy";
  const userId = res.locals.jwtData.id;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_payment_id + "|" + razorpay_subscription_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      // Find the user by userId
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { subscription } = req.body;
      if (!subscription) {
        return res
          .status(400)
          .json({ error: "Subscription details not provided" });
      }

      // Update the user with subscription details
      user.subscription.status = subscription.status;
      user.subscription.current_period_start = new Date(
        subscription.current_start
      );
      user.subscription.current_period_end = new Date(subscription.current_end);
      const updatedUser = await user.save();

      console.log("Subscription updated:", updatedUser);

      await logEvent(userId, AuditActionType.SUBSCRIPTION_UPDATE, "Passed", {
        details: {
          subscriptionId: razorpay_subscription_id,
          status: subscription.status,
        },
      });

      return res.json({ status: "ok" });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    console.error("Error processing payment verification:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
