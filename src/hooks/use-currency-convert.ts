import { useApi } from "@/hooks/useApi";
import { useState } from "react";

interface ConversionResult {
  success: boolean;
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  timestamp: string;
  source: string;
}

export const useCurrencyConvert = () => {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async (
    fromCurrency: string,
    toCurrency: string,
    amount: number,
  ): Promise<ConversionResult | null> => {
    if (!fromCurrency || !toCurrency || !amount) {
      setError("Missing parameters: fromCurrency, toCurrency, amount");
      return null;
    }

    // Jika same currency, no need to convert (instant)
    if (fromCurrency === toCurrency) {
      return {
        success: true,
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        convertedAmount: parseFloat(amount.toFixed(2)),
        rate: 1,
        timestamp: new Date().toISOString(),
        source: "same currency (no conversion)",
      };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchApi("/currencies/convert/rate", {
        method: "POST",
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || errData.error || "Conversion failed",
        );
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      const errorMsg = err.message || "Currency conversion error";
      setError(errorMsg);
      console.error("Conversion error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { convert, loading, error };
};
