const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

    const { dog_name, meals_eaten, food_brand, walk_count, walk_distance_km, training_log, mood, teacher_note } = await req.json()

    const moodKo: Record<string, string> = {
      sleepy: '졸린', neutral: '보통', happy: '기분 좋은', excited: '신난'
    }
    const mealsKo: Record<string, string> = {
      none: '거의 안 먹었고', half: '반 정도 먹었고', full: '다 먹었고'
    }
    const trainingText = training_log?.length
      ? training_log.map((t: { command: string; reps: number; success: number }) =>
          `${t.command} ${t.reps}회 중 ${t.success}회 성공`).join(', ')
      : ''

    const prompt = `강아지 유치원 알림장을 보호자가 받고 싶은 따뜻한 한국어 이야기로 변환해줘.
강아지 이름: ${dog_name}
기분: ${moodKo[mood] ?? mood}
식사: ${mealsKo[meals_eaten] ?? meals_eaten}${food_brand ? ` (${food_brand})` : ''}
산책: ${walk_count}회, ${walk_distance_km}km
${trainingText ? `훈련: ${trainingText}` : ''}
${teacher_note ? `선생님 메모: ${teacher_note}` : ''}

1~2문장으로, 강아지 이름을 포함해서, 이모지 1개 포함, 자연스러운 반말체로 작성.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    console.log('OpenAI response status:', res.status)
    if (!res.ok) {
      console.error('OpenAI error:', JSON.stringify(data))
      return Response.json({ error: 'OpenAI 오류' }, { status: 500, headers: corsHeaders })
    }

    const summary = data.choices?.[0]?.message?.content ?? ''
    return Response.json({ summary }, { headers: corsHeaders })
  } catch (error) {
    console.error('Function error:', error)
    return Response.json({ error: 'AI 요약 생성 실패' }, { status: 500, headers: corsHeaders })
  }
})
