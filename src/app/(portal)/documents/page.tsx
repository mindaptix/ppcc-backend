import { DocumentUpload } from "@/components/document-upload";
import { PageIntro } from "@/components/page-intro";

export const metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <>
      <PageIntro title="Documents" text="Images, video, PDF, Word, Excel, and PowerPoint saved for a district." />
      <div className="stack">
        <DocumentUpload />
      </div>
    </>
  );
}
