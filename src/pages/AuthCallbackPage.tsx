import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[#707072]">로그인 처리 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <img src="/logo.svg" alt="" />
      <h2 className="mt-[30px] text-[32px] font-bold text-[#211922]">
        만나서 반가워요!
      </h2>
      <p className="text-[#828282] text-center text-[14px] mt-2">
        오늘독과 함께 우리 친구의
        <br />
        일상을 스마트하게 :D
      </p>
      <Button
        className="w-full max-w-sm mt-[219px]"
        onClick={() => navigate("/onboarding", { replace: true })}
      >
        서비스 이용하기
      </Button>
    </div>
  );
}
