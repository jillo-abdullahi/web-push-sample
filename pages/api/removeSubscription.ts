import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res
        .status(400)
        .json({ error: "Missing endpoint in request body" });
    }

    try {
      // Find and delete the subscription by endpoint
      const deletedSubscription = await prisma.pushSubscription.delete({
        where: {
          endpoint,
        },
      });

      res.status(200).json({
        success: true,
        message: "Subscription removed successfully",
        subscription: deletedSubscription,
      });
    } catch (error) {
      if ((error as { code: string }).code === "P2025") {
        res.status(404).json({ error: "Subscription not found" });
      } else {
        console.error("Error removing subscription:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
