export type SimulationStep = {
  minQuantity: number;
  maxQuantity: number | null;
  calcQty: number;
  ctnLabel: string;
  qtyLabel: string;
};

/**
 * Calculates progressive quantity simulation steps for fixed-mode quotes.
 * If targetQtyPcs is set and not a full carton multiple (e.g. 50 pcs with 20 pcs/carton),
 * Step 0 represents the target MOQ (50 - 59 pcs, requiring 3 cartons),
 * and Step 1 starts at the next full carton multiple (60 pcs).
 */
export function getFixedSimulationSteps(
  moqCtn: number,
  qtyPerCtn: number,
  targetQtyPcs?: number | null
): SimulationStep[] {
  const safeQtyPerCtn = Math.max(1, qtyPerCtn || 1);
  const safeMoqCtn = Math.max(1, moqCtn || 1);
  const rawTargetPcs = Number(targetQtyPcs) || 0;

  const steps: SimulationStep[] = [];

  if (rawTargetPcs > 0 && rawTargetPcs % safeQtyPerCtn !== 0) {
    const neededCtns = Math.ceil(rawTargetPcs / safeQtyPerCtn);
    const nextCartonPcs = neededCtns * safeQtyPerCtn;

    // Step 0: from targetQtyPcs up to nextCartonPcs - 1
    steps.push({
      minQuantity: rawTargetPcs,
      maxQuantity: nextCartonPcs - 1,
      calcQty: rawTargetPcs,
      ctnLabel: `(${neededCtns} ctn)`,
      qtyLabel: `${rawTargetPcs} - ${nextCartonPcs - 1} pcs`,
    });

    // Subsequent steps start from neededCtns, neededCtns + 1, ... up to 5 steps total
    for (let i = 0; steps.length < 5; i++) {
      const stepCtn = neededCtns + i;
      const minQty = stepCtn * safeQtyPerCtn;
      const nextQty = (stepCtn + 1) * safeQtyPerCtn;
      const isLast = steps.length === 4;

      steps.push({
        minQuantity: minQty,
        maxQuantity: isLast ? null : nextQty - 1,
        calcQty: minQty,
        ctnLabel: isLast ? `(≥ ${stepCtn} ctn)` : `(${stepCtn} ctn)`,
        qtyLabel: isLast ? `≥ ${minQty} pcs` : `${minQty} - ${nextQty - 1} pcs`,
      });
    }
  } else {
    // Standard carton multiples (or targetQtyPcs is exact multiple or 0)
    const startCtn = rawTargetPcs > 0 ? Math.ceil(rawTargetPcs / safeQtyPerCtn) : safeMoqCtn;
    for (let step = 0; step < 5; step++) {
      const stepCtn = startCtn + step;
      const stepPcs = stepCtn * safeQtyPerCtn;
      const nextStepPcs = (stepCtn + 1) * safeQtyPerCtn;
      const isLast = step === 4;

      steps.push({
        minQuantity: stepPcs,
        maxQuantity: isLast ? null : nextStepPcs - 1,
        calcQty: stepPcs,
        ctnLabel: isLast ? `(≥ ${stepCtn} ctn)` : `(${stepCtn} ctn)`,
        qtyLabel: isLast ? `≥ ${stepPcs} pcs` : `${stepPcs} - ${nextStepPcs - 1} pcs`,
      });
    }
  }

  return steps;
}
