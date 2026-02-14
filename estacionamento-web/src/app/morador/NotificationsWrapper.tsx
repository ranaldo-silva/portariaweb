"use client";

import { useFcmToken } from "@/hooks/useFcmToken";

export default function NotificationsWrapper({ children }: { children: React.ReactNode }) {
    useFcmToken();
    return <>{children}</>;
}
