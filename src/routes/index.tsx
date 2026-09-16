import { createFileRoute } from "@tanstack/react-router";
import FacultyFlowApp from "../components/FacultyFlow.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faculty Flow" },
      {
        name: "description",
        content: "Faculty attendance, punctuality, and early-exit monitoring system.",
      },
      { property: "og:title", content: "Faculty Flow" },
      { property: "og:description", content: "Faculty attendance and early-exit monitoring system." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return <FacultyFlowApp />;
}
