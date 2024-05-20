// pages/api/saveSubscription.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { endpoint, expirationTime, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription payload' });
    }

    try {
      const subscription = await prisma.pushSubscription.create({
        data: {
          endpoint,
          expirationTime: expirationTime ? new Date(expirationTime) : null,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
      res.status(200).json(subscription);
    } catch (error) {
      console.error('Error saving subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
