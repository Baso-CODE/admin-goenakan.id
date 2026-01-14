import { Metadata } from "next";
import AddContactPlatform from "../components/addContactPlatform";

export const metadata: Metadata = {
  title: "Add New Platform",
  description:
    "Tambahkan jenis saluran komunikasi baru ke dalam master data sistem.",
};
export default function AddContactPlatformPage() {
  return <AddContactPlatform />;
}
