import { Metadata } from "next";
import EditContactPlatform from "../../components/editContactPlatform";

export const metadata: Metadata = {
  title: "Edit Contact Platform",
  description:
    "Perbarui detail platform komunikasi, konfigurasi icon, dan format tautan.",
};
export default function ContactPlatformEdit() {
  return <EditContactPlatform />;
}
