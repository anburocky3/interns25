import { Suspense } from "react";
import { ProjectsContent } from "./ProjectsContent";

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
