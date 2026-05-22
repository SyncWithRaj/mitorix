import { EditorProvider } from "@/context/EditorContext";

export default function ChatLayout({ children }: any) {
  return <EditorProvider>{children}</EditorProvider>;
}
