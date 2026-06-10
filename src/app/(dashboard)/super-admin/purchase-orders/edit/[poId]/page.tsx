"use client";

import { useParams } from "next/navigation";
import EditPurchaseOrderForm from "../../components/editPurchaseOrderForm";

export default function EditPurchaseOrder() {
  const params = useParams();
  const poId = params.poId as string;

  return (
    <>
      <EditPurchaseOrderForm poId={poId} />
    </>
  );
}
