"use client";

import { useEffect, useState } from "react";
import useServiceWorker from "@/hooks/useServiceWorker";
import { Toggle } from "@/components/Toggle";
import { useCheckSubscription } from "@/hooks/useCheckSubscription";

export default function Home() {
  // register service worker
  useServiceWorker();

  // check if current device is subscribed to notifications
  const { isSubscribed, checkSubscription } = useCheckSubscription();

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
    // if user previously disallowed notifications,
    // they will have to manually re-enable it themselves
    if (permissionGranted === "denied") {
      alert(
        "You previously denied permission. Please enable notifications from browser settings."
      );
      return;
    }
    try {
      const sw = await navigator.serviceWorker.ready;

      // pushSubsription response to be pushed to the BE
      const pushSubscription = await sw?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setPermissionGranted("granted");

      // save to db
      await sendSubscriptionToServer(pushSubscription);
      await checkSubscription();
    } catch (err) {
      setPermissionGranted("denied");
      console.log("An error occurred with the service worker", err);
    }
  };

  const unsubscribe = async () => {
    const sw = await navigator.serviceWorker.ready;
    const subscription = await sw?.pushManager.getSubscription();

    if (subscription) {
      const { endpoint } = subscription;
      try {
        const response = await fetch("/api/removeSubscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove subscription");
        }

        const result = await response.json();
        console.log("Subscription removed successfully:", result);
      } catch (error) {
        console.error("Error removing subscription:", error);
      }
    }
    // re-check subscription to update state.
    await checkSubscription();
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center space-y-10 w-72">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex flex-col items-start justify-center space-y-2">
            <div className="flex space-x-2 items-center justify-center">
              <p>Enable notifications</p>
              <Toggle
                onChange={isSubscribed ? unsubscribe : subscribe}
                isSubscribed={isSubscribed}
                permissionGranted={permissionGranted}
              />
            </div>
            <span className="text-xs">
              {isSubscribed
                ? "Notifications are enabled. You'll receive timely transactions status updates."
                : "Notifications are disabled. You'll miss out on timely transaction updates."}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start space-y-2 rounded-2xl border-yellow-100 border p-4 w-full">
          <p className="w-full">Send a sample notification</p>
          <span className="text-xs w-full">
            Sends a sample notification to ALL subscriptions.
          </span>
          <div className="w-full text-center">
            <button
              type="button"
              className="rounded-md bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
              onClick={sendNotificationToAll}
            >
              Send notification
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
