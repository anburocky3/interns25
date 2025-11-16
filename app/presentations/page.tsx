import PresentationGenerator from "@/components/PresentationGenerator";
import internsData from "@/data/internsData";

export default function PresentationPage() {
  return (
    <div className="p-6">
      <PresentationGenerator interns={internsData} />
    </div>
  );
}
