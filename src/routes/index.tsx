import { createFileRoute } from "@tanstack/react-router";
// @ts-expect-error - JSX component without type declarations
import FacultyFlowApp from "../components/FacultyFlow.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faculty Flow — Teacher Roll Call & Attendance" },
      {
        name: "description",
        content:
          "Track teacher attendance, punctuality and late arrivals with live punch-sheet sync, department analytics and per-teacher monthly late reports.",
      },
      { property: "og:title", content: "Faculty Flow — Teacher Roll Call & Attendance" },
      {
        property: "og:description",
        content:
          "Live teacher attendance dashboard with history, analytics and instant search for any teacher's monthly late count.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <FacultyFlowApp />;
}
