import InternGrid from "@/components/InternGrid";
import getCachedUsers from "@/lib/getUsers";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CyberDude Internship Program - Meet Our Interns",
  description:
    "Explore the talented interns of the CyberDude Internship Program. Discover profiles of students and professionals building the future with us.",
  keywords:
    "internship, CyberDude, interns, talent, technology, students, professionals",
  authors: [{ name: "CyberDude Networks" }],
  alternates: {
    canonical: "https://interns.cyberdudenetworks.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://interns.cyberdudenetworks.com",
    title: "CyberDude Internship Program - Meet Our Interns",
    description:
      "Explore the talented interns of the CyberDude Internship Program. Discover profiles of students and professionals building the future with us.",
    images: [
      {
        url: "https://jobs.cyberdudenetworks.com/cyberdude-jobs-banner.png",
        width: 1200,
        height: 630,
        alt: "CyberDude Internship Program",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberDude Internship Program - Meet Our Interns",
    description:
      "Explore the talented interns of the CyberDude Internship Program.",
    images: ["https://jobs.cyberdudenetworks.com/cyberdude-jobs-banner.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default async function Home() {
  const interns = await getCachedUsers();

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-900 via-neutral-900 to-black">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-blue-600/10 to-purple-600/10 border-b border-neutral-800 py-12">
        <div className="px-4 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-white to-blue-300 bg-clip-text text-transparent mb-2 leading-normal">
            CyberDude Internship Program
          </h1>
          <p className="text-gray-400 text-lg">
            Meet our talented interns building the future
          </p>
        </div>
      </div>

      <div className="px-4 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Chief Mentor Card */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="bg-linear-to-br from-neutral-800 to-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-700 hover:border-blue-500/50 transition-colors">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-6 text-center">
                Chief Mentor
              </h4>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32">
                  <Image
                    alt="Anbuselvan Annamalai"
                    loading="lazy"
                    fill
                    className="rounded-full object-cover border-2 border-blue-500/30"
                    src="https://github.com/anburocky3.png"
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-lg">Anbuselvan</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Mentor & Project Head
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interns Grid */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            <InternGrid interns={interns} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-sm mt-16">
        <div className="px-4 py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Alumni Section */}
            <div className="text-center md:text-left">
              <h5 className="font-semibold text-white mb-3">Alumni Network</h5>
              <a
                href="https://cyberdude-internship-tracker.vercel.app/"
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Past Interns →
              </a>
            </div>

            {/* Contact Section */}
            <div className="text-center">
              <h5 className="font-semibold text-white mb-3">Hiring?</h5>
              <a
                href="mailto:hr@cyberdudenetworks.com"
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm inline-flex items-center gap-1"
              >
                Get in Touch →
              </a>
            </div>

            {/* Social Section */}
            <div className="text-center md:text-right">
              <h5 className="font-semibold text-white mb-3">Follow Us</h5>
              <a
                href="https://www.linkedin.com/search/results/all/?keywords=%23cyberdudeinternship"
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm inline-flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn Articles →
              </a>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© 2025 CyberDude Networks. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
