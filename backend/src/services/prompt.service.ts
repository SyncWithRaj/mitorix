export const buildPrompt = (question: string, entities: any[]) => {
  const context = entities
    .map(
      (e, i) => `
File: ${e.filePath}
Lines: ${e.startLine}-${e.endLine}

${e.code}
`
    )
    .join("\n\n");

  return `
You are an AI assistant that helps developers understand a codebase.

User Question:
${question}

Relevant Code Context:
${context}

Instructions:
- Answer using ONLY the given code context
- Mention file paths and line numbers
- If the answer is not in the context, say "Not found in codebase"
`;
};
