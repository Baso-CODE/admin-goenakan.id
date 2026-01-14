import { Metadata } from "next";
import ContactPlatformsManagement from "./components/contactPlatformManagement";

export const metadata: Metadata = {
  title: "Contact Platforms",
  description:
    "Kelola master data platform komunikasi, jenis saluran kontak, dan integrasi media sosial.",
};
export default function ContactPlatformManagementPage() {
  return <ContactPlatformsManagement />;
}
