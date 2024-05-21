// check if endpoint is subscribed.
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res
        .status(400)
        .json({ error: "Missing endpoint in request body" });
    }

    try {
      // Check if the subscription exists in the database
      const subscription = await prisma.pushSubscription.findUnique({
        where: {
          endpoint,
        },
      });

      if (subscription) {
        res.status(200).json({ subscribed: true, subscription });
      } else {
        res.status(200).json({ subscribed: false });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
