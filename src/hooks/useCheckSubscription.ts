import { useEffect, useState } from "react";

export const useCheckSubscription = (): {
  isSubscribed: boolean;
  checkSubscription: () => void;
} => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscription = async () => {
    const sw = await navigator.serviceWorker.ready;
    const subscription = await sw?.pushManager.getSubscription();

    if (subscription) {
      const { endpoint } = subscription;
      try {
        const response = await fetch("/api/checkSubscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setIsSubscribed(false);
          throw new Error(errorData.error || "Failed to check subscription");
        }

        const result = await response.json();
        console.log(
          "Subscription status:",
          result.subscribed ? "Subscribed" : "Not Subscribed"
        );
        setIsSubscribed(result.subscribed);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false);
      }
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return { isSubscribed, checkSubscription };
};
