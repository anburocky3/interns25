import PresentationGenerator from "@/components/PresentationGenerator";
import getCachedUsers from "@/lib/getUsers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presentation Mode - CyberDude Internship Program",
  description:
    "Interactive presentation mode to showcase CyberDude interns with built-in timer and filtering options.",
  keywords: "presentation, internship, CyberDude, showcase, demo",
  authors: [{ name: "CyberDude Networks" }],
  alternates: {
    canonical: "https://interns.cyberdudenetworks.com/presentations",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://interns.cyberdudenetworks.com/presentations",
    title: "Presentation Mode - CyberDude Internship Program",
    description:
      "Interactive presentation mode to showcase CyberDude interns with built-in timer and filtering options.",
    images: [
      {
        url: "https://jobs.cyberdudenetworks.com/cyberdude-jobs-banner.png",
        width: 1200,
        height: 630,
        alt: "CyberDude Presentations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Presentation Mode - CyberDude Internship Program",
    description: "Interactive presentation mode to showcase CyberDude interns.",
    images: ["https://jobs.cyberdudenetworks.com/cyberdude-jobs-banner.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default async function PresentationPage() {
  const interns = await getCachedUsers("dev");

  return (
    <div className="p-6">
      <PresentationGenerator interns={interns} />
    </div>
  );
}
