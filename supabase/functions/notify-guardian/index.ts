import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  const { report_id } = await req.json()

  const { data: report } = await supabase
    .from('daily_reports')
    .select('*, dogs(name, owner_id)')
    .eq('id', report_id)
    .single()

  if (!report?.published_at) return new Response('Not published', { status: 400 })

  const dog = report.dogs as any
  const dogName = dog?.name ?? '강아지'

  // Get guardian email from auth.users
  const { data: userData } = await supabase.auth.admin.getUserById(dog?.owner_id ?? '')
  const ownerEmail = userData?.user?.email
  if (!ownerEmail) return new Response('No guardian email', { status: 404 })

  const summary = report.ai_summary ?? `${dogName}의 오늘 알림장이 도착했어요!`
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://doggy-note.vercel.app'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Doggy-note <noreply@doggy-note.app>',
      to: ownerEmail,
      subject: `🐾 ${dogName}의 오늘 알림장이 도착했어요`,
      html: `<p>${summary}</p><p><a href="${siteUrl}/feed">알림장 보러가기</a></p>`,
    }),
  })

  return new Response('OK')
})
