"use client";

import OpsLogisticsLateDeliveries from "../customer-analytic/opsLogisticsLateDeliveries";
import OpsLogisticsAverages from "../ops/opsLogisticsAverages";
import OpsLogisticsMetrics from "../ops/opsLogisticsMetrics";
import OpsQuotationSection from "../ops/opsQuotationSection";
import OpsSampleSection from "../ops/opsSampleSection";

export default function OpsDashboardTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 mt-6 pb-10">
      {/* SECTION A: LOGISTICS */}
      <div className="space-y-4">
        <OpsLogisticsMetrics />
        <OpsLogisticsAverages />
        <OpsLogisticsLateDeliveries />
      </div>

      {/* SECTION B: SAMPLE */}
      <OpsSampleSection />

      {/* SECTION C: QUOTATION */}
      <OpsQuotationSection />
    </div>
  );
}
