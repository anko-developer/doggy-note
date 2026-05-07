import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Home,
  Megaphone,
  Calendar,
  Image,
  UtensilsCrossed,
  NotebookPen,
} from "lucide-react";

const TEACHER_TABS = [
  { to: "/", icon: Home },
  { to: "/announcements", icon: Megaphone },
  { to: "/schedule", icon: Calendar },
  { to: "/album", icon: Image },
  { to: "/meal-plan", icon: UtensilsCrossed },
];

const GUARDIAN_TABS = [
  { to: "/feed", icon: NotebookPen },
  { to: "/announcements", icon: Megaphone },
  { to: "/schedule", icon: Calendar },
  { to: "/album", icon: Image },
];

export default function TabBar() {
  const { role } = useAuth();
  const tabs = role === "teacher" ? TEACHER_TABS : GUARDIAN_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[#CACACB] bg-white">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-0.5 py-3 text-xs",
              isActive ? "text-[#111111] font-medium" : "text-[#9E9EA0]",
            )
          }
        >
          <tab.icon className="size-6" />
        </NavLink>
      ))}
    </nav>
  );
}
