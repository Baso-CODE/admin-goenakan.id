"use client";

import { LoginForm } from "@/components/login-form";
import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Import carousel dari shadcn
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

// Import plugin autoplay dari embla
import Autoplay from "embla-carousel-autoplay";

const IMAGES = [
  { src: "/images/goenakan_id.jpg", alt: "Goenakan ID - Modern Workspace" },
  { src: "/images/goenakan_id2.jpg", alt: "Goenakan Office Interior" },
  { src: "/images/goenakan_id3.jpg", alt: "Team Collaboration" },
  { src: "/images/goenakan_id4.jpg", alt: "Technology & Innovation" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* === LEFT SIDE: FORM === */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src={"/goenakan_logo.webp"}
              width={135}
              height={135}
              alt="Logo"
              loading="eager"
            />

            {/* <span className="text-lg font-semibold tracking-tight">
              Goenakan ID
            </span> */}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* === RIGHT SIDE: CAROUSEL IMAGE SLIDER === */}
      <div className="relative hidden lg:flex items-center justify-center bg-muted overflow-hidden">
        <Carousel
          plugins={[
            Autoplay({
              delay: 2500, // Ganti delay sesuai keinginan (ms)
              stopOnInteraction: false,
            }),
          ]}
          className="w-full h-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            {IMAGES.map((img, index) => (
              <CarouselItem key={index} className="relative h-screen">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover brightness-90 dark:brightness-[0.3] dark:grayscale"
                  priority={index === 0}
                />
                <div className="absolute bottom-8 left-8 bg-black/40 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-sm shadow-md">
                  {img.alt}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
