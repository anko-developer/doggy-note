import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, useAuth } from "@/hooks/useAuth";
import RoleSelect from "@/components/onboarding/RoleSelect";
import type { UserRole } from "@/types/domain";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [_saving, setSaving] = useState(false);

  if (loading) return <div className="p-4">Loading...</div>;

  if (user) {
    const pendingToken = localStorage.getItem("pendingInviteToken");
    if (pendingToken) {
      localStorage.removeItem("pendingInviteToken");
      navigate(`/invite/${pendingToken}`, { replace: true });
      return null;
    }
  }

  if (user && role === "teacher") return <Navigate to="/" replace />;
  if (user && role === "guardian") return <Navigate to="/feed" replace />;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-[50px] font-bold text-[#222]">오늘Dog</h1>
        <p className="text-center text-[20px] text-[#444]">
          오늘독 내일독 내일모레독 <br />늘 궁금한 집사를 위한 스마트한 알림장
        </p>
        <Button onClick={signInWithGoogle} className={"w-full mt-[214px]"}>
          로그인
        </Button>
      </div>
    );
  }

  async function handleRoleSelect(selectedRole: UserRole) {
    if (!user) return;
    setSaving(true);
    const displayName = user.user_metadata?.full_name ?? "";

    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const { error } = existing
      ? await supabase
          .from("user_profiles")
          .update({ role: selectedRole, display_name: displayName })
          .eq("id", user.id)
      : await supabase.from("user_profiles").insert({
          id: user.id,
          role: selectedRole,
          display_name: displayName,
        });

    if (error) {
      console.error("프로필 생성 실패:", error);
      setSaving(false);
      return;
    }
    if (selectedRole === "teacher") navigate("/onboarding/join-daycare");
    else navigate("/feed");
    setSaving(false);
  }

  return <RoleSelect onSelect={handleRoleSelect} />;
}
