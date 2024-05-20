"use client";

import { useEffect, useState } from "react";
import useServiceWorker from "@/hooks/useServiceWorker";

export default function Home() {
  // register service worker
  useServiceWorker();

  const [permissionGranted, setPermissionGranted] =
    useState<NotificationPermission>("default");

  // Calling Notification.permission directly locks up the main thread in Chrome.
  // using it as a fallback
  const getNotificationPermissionState = async () => {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({
        name: "notifications",
      });
      setPermissionGranted(result.state as NotificationPermission);
      return;
    }
    setPermissionGranted(Notification.permission);
  };

  useEffect(() => {
    // check permission level
    getNotificationPermissionState();
  }, []);

  // save subscription to the BE
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    const response = await fetch("/api/saveSubscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription");
    }

    return response.json();
  };

  const subscribe = async () => {
    try {
      const sw = await navigator.serviceWorker.ready;

      // pushSubsription response to be pushed to the BE
      const pushSubscription = await sw?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setPermissionGranted("granted");

      // save to db
      sendSubscriptionToServer(pushSubscription);
    } catch (err) {
      setPermissionGranted("denied");
      console.log("An error occurred with the service worker", err);
    }
  };

  // Function to send notification to all subscribed users
  const sendNotificationToAll = async () => {
    const title = "GasHawk - transaction concluded";
    const message = "See how much you have saved.";
    try {
      const response = await fetch("/api/sendNotification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      console.log("Notification sent successfully.");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // button text for notification request
  let notificationButtonText = "Request permission";
  if (permissionGranted === "denied") {
    notificationButtonText = "Notification permission denied";
  } else if (permissionGranted === "granted") {
    notificationButtonText = "Notifications permission granted";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center space-y-10">
        <div className="flex flex-col items-center space-y-2">
          <p>User initiates the permission request.</p>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
            onClick={subscribe}
            disabled={permissionGranted === "granted"}
          >
            {notificationButtonText}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <p>Send a sample notification</p>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
            onClick={sendNotificationToAll}
          >
            Send notification
          </button>
        </div>
      </div>
    </main>
  );
}
