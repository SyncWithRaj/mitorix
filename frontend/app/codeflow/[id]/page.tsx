"use client";

import { use } from "react";
import { CodeflowProvider } from "../../../context/CodeflowContext";
import CodeflowLayout from "../../../components/codeflow/CodeflowLayout";
import ForceGraph from "../../../components/codeflow/ForceGraph";

export default function CodeFlowIDE({ params }: { params: Promise<{ id: string }> }) {
  const { id: repoId } = use(params);

  return (
    <CodeflowProvider>
      <CodeflowLayout repoId={repoId}>
        <div className="absolute inset-0">
           <ForceGraph />
        </div>
      </CodeflowLayout>
    </CodeflowProvider>
  );
}
