"use client";

import { AlertCircle, CheckCircle2, Info, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SEOProps {
  title: string;
  content: string; // Teks HTML dari Tiptap
  focusKeywords: string; //  PERUBAHAN: Sekarang pakai 's' (plural)
}

interface SEOCheckResult {
  label: string;
  score: number; // 1-9 (mirip skala Yoast: 1-4 Merah, 5-7 Oranye, 8-9 Hijau)
  text: string;
}

export function SEOAnalyzer({ title, content, focusKeywords }: SEOProps) {
  //  PERUBAHAN: Destructure focusKeywords
  const [results, setResults] = useState<SEOCheckResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    // Cek menggunakan focusKeywords
    if (!focusKeywords || focusKeywords.trim() === "") {
      setResults([]);
      setOverallScore(0);
      return;
    }

    const runCustomSEOAnalysis = () => {
      try {
        const checks: SEOCheckResult[] = [];

        //  LOGIKA MULTI-KEYWORD: Pisahkan kata kunci berdasarkan tanda koma
        const keywordArray = focusKeywords
          .split(",")
          .map((k) => k.toLowerCase().trim())
          .filter((k) => k.length > 0);

        if (keywordArray.length === 0) return;

        // 1. Parsing HTML konten menggunakan DOMParser bawaan browser
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        const plainText = doc.body.textContent || "";
        const words = plainText.split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        // Pengecekan 1: Panjang Judul
        if (title.length < 40) {
          checks.push({
            label: "Judul",
            score: 4,
            text: "Judul terlalu pendek. Idealnya 40-60 karakter.",
          });
        } else if (title.length > 60) {
          checks.push({
            label: "Judul",
            score: 5,
            text: "Judul agak panjang. Pastikan kata kunci utama ada di depan.",
          });
        } else {
          checks.push({
            label: "Judul",
            score: 9,
            text: "Panjang judul sangat ideal (40-60 karakter).",
          });
        }

        // Pengecekan 2: Kata Kunci di Judul (Mengecek semua kata kunci di array)
        const titleLower = title.toLowerCase();
        const keywordsInTitle = keywordArray.filter((kw) =>
          titleLower.includes(kw),
        );

        if (keywordsInTitle.length > 0) {
          checks.push({
            label: "Kata Kunci Judul",
            score: 9,
            text: `Menemukan ${keywordsInTitle.length} target kata kunci di dalam judul.`,
          });
        } else {
          checks.push({
            label: "Kata Kunci Judul",
            score: 3,
            text: "Tidak satu pun target kata kunci <strong>ditemukan</strong> di judul.",
          });
        }

        // Pengecekan 3: Panjang Konten
        if (wordCount < 300) {
          checks.push({
            label: "Konten",
            score: 4,
            text: `Teks berisi ${wordCount} kata. Minimal yang disarankan adalah 300 kata.`,
          });
        } else {
          checks.push({
            label: "Konten",
            score: 9,
            text: `Panjang konten bagus (${wordCount} kata).`,
          });
        }

        // Pengecekan 4: Kerapatan Kata Kunci Kombinasi (Keyword Density)
        let totalKeywordOccurrences = 0;
        keywordArray.forEach((kw) => {
          const keywordRegex = new RegExp(kw, "gi");
          const matches = plainText.match(keywordRegex) || [];
          totalKeywordOccurrences += matches.length;
        });

        const density =
          wordCount > 0 ? (totalKeywordOccurrences / wordCount) * 100 : 0;

        if (totalKeywordOccurrences === 0) {
          checks.push({
            label: "Kerapatan",
            score: 2,
            text: "Semua kata kunci tidak ditemukan sama sekali di dalam konten.",
          });
        } else if (density > 3.0) {
          checks.push({
            label: "Kerapatan",
            score: 4,
            text: `Kerapatan kata kunci terlalu tinggi (${density.toFixed(1)}%). Hati-hati <em>keyword stuffing</em>.`,
          });
        } else if (density >= 0.5 && density <= 3.0) {
          checks.push({
            label: "Kerapatan",
            score: 9,
            text: `Kerapatan kata kunci sangat baik (${density.toFixed(1)}%).`,
          });
        } else {
          checks.push({
            label: "Kerapatan",
            score: 6,
            text: `Total kata kunci muncul ${totalKeywordOccurrences} kali. Coba tambahkan sedikit lagi di paragraf.`,
          });
        }

        // Pengecekan 5: Keberadaan Heading (H2, H3)
        const headings = doc.querySelectorAll("h2, h3, h4");
        if (headings.length === 0) {
          checks.push({
            label: "Heading",
            score: 4,
            text: "Tidak ada sub-heading (H2/H3). Gunakan sub-heading untuk menstrukturkan artikel.",
          });
        } else {
          checks.push({
            label: "Heading",
            score: 9,
            text: "Struktur sub-heading (H2/H3) sudah digunakan dengan baik.",
          });
        }

        // Pengecekan 6: Tautan Keluar/Internal (Outbound/Internal Links)
        const links = doc.querySelectorAll("a");
        if (links.length === 0) {
          checks.push({
            label: "Tautan",
            score: 5,
            text: "Belum ada tautan (link) di halaman ini. Tambahkan tautan internal atau eksternal.",
          });
        } else {
          checks.push({
            label: "Tautan",
            score: 9,
            text: "Artikel memiliki tautan yang baik untuk SEO.",
          });
        }

        // Pengecekan 7: Alt Text pada Gambar
        const images = doc.querySelectorAll("img");
        if (images.length > 0) {
          const imagesWithoutAlt = Array.from(images).filter(
            (img) => !img.alt || img.alt.trim() === "",
          );
          if (imagesWithoutAlt.length > 0) {
            checks.push({
              label: "Gambar",
              score: 4,
              text: `Ada ${imagesWithoutAlt.length} gambar yang tidak memiliki atribut <em>alt text</em>.`,
            });
          } else {
            checks.push({
              label: "Gambar",
              score: 9,
              text: "Semua gambar di dalam konten sudah memiliki <em>alt text</em>.",
            });
          }
        }

        // Urutkan hasil: Skor terendah di atas agar menjadi prioritas perbaikan
        const sortedResults = checks.sort((a, b) => a.score - b.score);
        setResults(sortedResults);

        // Hitung Skor Keseluruhan (Rata-rata lalu konversi ke persentase 0-100)
        const totalScore = checks.reduce((acc, curr) => acc + curr.score, 0);
        const maxPossibleScore = checks.length * 9;
        const percentage = Math.round((totalScore / maxPossibleScore) * 100);

        setOverallScore(percentage || 0);
      } catch (error) {
        console.error("Gagal menjalankan Analisis SEO Kustom:", error);
      }
    };

    // Debounce manual
    const timer = setTimeout(() => {
      runCustomSEOAnalysis();
    }, 500);

    return () => clearTimeout(timer);
  }, [title, content, focusKeywords]); //  PERUBAHAN: Pastikan focusKeywords masuk ke dependency array

  const getScoreIcon = (score: number) => {
    if (score >= 8) {
      return (
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
      );
    }
    if (score >= 5) {
      return <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />;
    }
    return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
  };

  return (
    <div className="p-4 border border-stone-200 rounded-xl bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-bold text-sm text-stone-800">Skor SEO</h3>
        <span
          className={`text-xl font-extrabold ${
            overallScore >= 80
              ? "text-green-600"
              : overallScore >= 50
                ? "text-orange-500"
                : "text-red-500"
          }`}>
          {focusKeywords ? `${overallScore}/100` : "N/A"}
        </span>
      </div>

      {!focusKeywords ? (
        <div className="flex flex-col items-center justify-center py-6 text-stone-400">
          <Search className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-xs text-center">
            Silakan masukkan Target Kata Kunci (pisahkan dengan koma) untuk
            memulai analisis konten.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {results.map((res, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              {getScoreIcon(res.score)}
              <span
                className="text-stone-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: res.text }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
