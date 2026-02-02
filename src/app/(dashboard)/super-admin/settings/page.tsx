import { Metadata } from "next";
import AppSettings from "../settings/components/formAppSetting";

export const metadata: Metadata = {
  title: "Tracking & Analytics Settings | Super Admin",
  description:
    "Konfigurasi Google Ads ID, GTM, dan Facebook Pixel untuk website.",

  robots: {
    index: false,
    follow: false,
  },
};

export default function AppSettingPage() {
  return <AppSettings />;
}
