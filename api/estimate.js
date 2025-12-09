export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { description } = req.body;
    
    if (!description || description.length < 10) {
      res.status(400).json({ error: 'Descrição inválida', cost: 6000 });
      return;
    }
    
    const prompt = `Você é um especialista em precificação de projetos de automação de dados e Business Intelligence.

Analise a seguinte descrição de necessidade de automação e estime o valor de investimento necessário em Reais (BRL):

"${description}"

Considere:
- Complexidade técnica
- Tempo de desenvolvimento estimado
- Integrações necessárias
- Manutenção e suporte

Faixa de valores típicos no mercado brasileiro:
- Automações simples (consolidação, relatórios básicos): R$ 3.000 - R$ 5.000
- Automações médias (ETL, dashboards, APIs): R$ 6.000 - R$ 12.000
- Automações complexas (pipelines, múltiplas fontes): R$ 15.000 - R$ 30.000
- Automações envolvendo Ciência de Dados e Inteligência Artificial: A partir de R$ 50.000

Responda APENAS com o valor numérico estimado (sem símbolo de moeda, sem formatação, apenas o número). Exemplo: 8500`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em precificação de projetos de automação de dados. Sempre responda apenas com números.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro API Groq: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    const costMatch = aiResponse.match(/\d+/);
    if (costMatch) {
      const cost = parseInt(costMatch[0]);
      if (cost >= 1000 && cost <= 50000) {
        res.status(200).json({ cost });
        return;
      }
    }
    
    res.status(200).json({ cost: 6000 });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(200).json({ error: 'Erro ao estimar', cost: 6000 });
  }
}