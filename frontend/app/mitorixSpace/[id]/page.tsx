"use client";

import { use } from "react";
import { CodeflowProvider } from "../../../context/CodeflowContext";
import CodeflowLayout from "../../../components/codeflow/CodeflowLayout";
import ForceGraph from "../../../components/codeflow/ForceGraph";
import AuthGuard from "../../../components/auth/AuthGuard";

export default function CodeFlowIDE({ params }: { params: Promise<{ id: string }> }) {
  const { id: repoId } = use(params);

  return (
    <AuthGuard>
      <CodeflowProvider>
        <CodeflowLayout repoId={repoId}>
          <div className="absolute inset-0">
            <ForceGraph />
          </div>
        </CodeflowLayout>
      </CodeflowProvider>
    </AuthGuard>
  );
}
