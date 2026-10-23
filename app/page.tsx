import { Sheet } from "./sheet";
import { isQlooConfigured } from "../lib/qloo/client";

export default function Home() {
  return <Sheet qlooLive={isQlooConfigured()} />;
}
