// pages/api/sendNotification.ts

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import webPush from "web-push";

const prisma = new PrismaClient();

// Configure web-push with your VAPID keys
webPush.setVapidDetails(
  "mailto:jillo@gashawk.io",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { title, message } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ error: "Missing title or message in request body" });
    }

    try {
      // Retrieve all push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany();

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ error: "No subscriptions found" });
      }

      // Prepare the notification payload
      const payload = JSON.stringify({
        title,
        body: message,
        icon: "/icon.jpeg",
        badge: "/icon.jpeg",
        data: {}, // Optional data - could be the TX details such as hash, status etc
      });

      // Send notifications to all subscribers
      await Promise.all(
        subscriptions.map(async (subscription) => {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
            expirationTime: subscription.expirationTime,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          };
          await webPush.sendNotification(pushSubscription, payload);
        })
      );

      res
        .status(200)
        .json({ success: true, message: "Notifications sent successfully" });
    } catch (error) {
      console.error("Error sending notifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
