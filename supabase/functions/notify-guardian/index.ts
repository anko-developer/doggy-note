import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://doggy-note.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return Response.json({ error: '이메일 서비스가 설정되지 않았어요.' }, { status: 500, headers: corsHeaders })
    }

    const { report_id } = await req.json()
    if (!report_id) {
      return Response.json({ error: 'report_id가 필요해요.' }, { status: 400, headers: corsHeaders })
    }

    // 알림장 + 강아지 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .select('id, published_at, ai_summary, dogs(name, owner_id)')
      .eq('id', report_id)
      .single()

    if (reportError || !report) {
      return Response.json({ error: '알림장을 찾을 수 없어요.' }, { status: 404, headers: corsHeaders })
    }
    if (!report.published_at) {
      return Response.json({ error: '발송되지 않은 알림장이에요.' }, { status: 400, headers: corsHeaders })
    }

    const dog = report.dogs as { name: string; owner_id: string | null } | null
    const dogName = dog?.name ?? '강아지'
    const ownerId = dog?.owner_id

    if (!ownerId) {
      return Response.json({ error: '보호자가 연결되지 않은 강아지예요.' }, { status: 404, headers: corsHeaders })
    }

    // 보호자 이메일 조회 (service_role만 접근 가능)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ownerId)
    if (userError || !userData.user?.email) {
      return Response.json({ error: '보호자 이메일을 찾을 수 없어요.' }, { status: 404, headers: corsHeaders })
    }
    const ownerEmail = userData.user.email

    const summary = report.ai_summary ?? `${dogName}의 오늘 알림장이 도착했어요!`

    // Resend 이메일 발송
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Doggy-note <onboarding@resend.dev>',
        to: ownerEmail,
        subject: `🐾 ${dogName}의 오늘 알림장이 도착했어요`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111111; margin-bottom: 12px;">
              🐾 ${dogName}의 알림장
            </h2>
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 24px;">
              ${summary}
            </p>
            <a href="${SITE_URL}/feed"
               style="display: inline-block; background: #111111; color: #fff;
                      padding: 12px 24px; border-radius: 30px; text-decoration: none;
                      font-size: 14px; font-weight: 500;">
              알림장 전체 보기
            </a>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.json()
      console.error('Resend error:', JSON.stringify(errBody))
      return Response.json({ error: '이메일 발송에 실패했어요.' }, { status: 500, headers: corsHeaders })
    }

    return Response.json({ ok: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('notify-guardian error:', error)
    return Response.json({ error: '알 수 없는 오류가 발생했어요.' }, { status: 500, headers: corsHeaders })
  }
})
