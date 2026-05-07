import { Outlet, Navigate } from "react-router-dom";
import { useAuth, signOut } from "@/hooks/useAuth";
import TabBar from "@/components/layout/TabBar";

export default function AppLayout() {
  const { user, role, daycareId, loading } = useAuth();

  const currentPath = window.location.pathname;

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        로딩 중...
      </div>
    );
  if (!user || !role) return <Navigate to="/onboarding" replace />;
  if (role === "teacher" && !daycareId)
    return <Navigate to="/onboarding/join-daycare" replace />;
  if (role === "guardian" && currentPath === "/")
    return <Navigate to="/feed" replace />;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#CACACB]">
        <span className="flex items-center gap-2 font-bold text-[#111111]">
          오늘 Dog <img src="/logo.svg" alt="오늘 Dog" className="size-6" />
        </span>
        <button onClick={signOut} className="text-sm text-[#9E9EA0]">
          로그아웃
        </button>
      </header>
      <main className="pb-20">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
