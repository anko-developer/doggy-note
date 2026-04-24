import Anthropic from 'npm:@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

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

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = (message.content[0] as { type: 'text'; text: string }).text
    return Response.json({ summary })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'AI 요약 생성 실패' }, { status: 500 })
  }
})
