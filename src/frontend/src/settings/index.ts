export const BadSample = `- Wrote a report.
- Worked on project Adam.
- Attended weekly meetings.`

// const IC_PRINCIPAL = `Individual accomplishments that contribute to team, business or customer results. As a principal IC, I am expected to work on complex customer projects and initiatives, promote and work on team, cross-domain, and cross region collaboration, and be adept at knowledge transfer.`

export const GoodSample = `- Wrote a report that is used by the organization to track important metrics around number of projects delivered.
- Worked on project Adam where I designed, developed and deployed a resilient and highly scalable time management software system used by the entire organization.
- Led a knowledge session transfer on developing using Adam.
- Attended weekly meetings. During one of these meetings, I contributed with an idea to have more effective retrospective meetings.
- Helped Mary with her ACME project where I explained how to configure and the benefits of monitoring the application.
- Participated in re-writing documentation for project Adam to help develop a guide on its usage.
- Participated in the development of Project Endeavor led by Rajesh. I also provided ideas to improve on the original design.
- Participated in Women events where I asked questions, and I provided feedback.
- Help organize the team Friday social hour during work hours.`

export const Labels = {
  system: 'System Prompt',
  individualImpact: 'Individual Impact',
  helpingOthers: 'Helping Others',
  leveragingOthers: 'Leveraging Others',
  dni: 'D&I',
  other: 'Other',
  score: 'Process Score',
  reason: 'Reason',
  overall: 'Overall',
  BadSample: 'Bad Sample',
  GoodSample: 'Better Sample',
  reset: 'Reset',
  processing: 'Processing',
  endpoint: 'Azure GPT endpoint',
  apiKey: 'API Key',
  temperature: 'Temperature',
  endpointTitle: `Please provide a full GPT4 or GPT3 endpoint. Example:\n\nhttps://NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=2024-02-15-preview\n\nNote: GPT4 may provide richer explanations. The easiest way to get this endpoint is to deploy a model in the Azure portal and copy\nthe endpoint from curl command in 'view code' Chat playground.`,
  consultant: `In my role and level, individual impact requires 100% yearly utilization or higher.`,
  PM: `In my role, I need to manage complex customer relationships, work with the stakeholders and others to remove blockers, and participate in learning and scaling iniatiatives to help others.`,
  Engineer: `In my role, I need to design, build and deploy scalable, performant, resilient  and cost-effective software system.`,
}

export const TokenCounts = {
  input: 0,
  output: 0,
  total: 0
}

export const Default_System_Prompt = `system:

You are an agent that can help evaluate an employee's self-evaluation writeup including: 

Objectives:
<IMPACT_OBJECTIVES>

Rules:
- Activities alone do not represent impact. For example, "I wrote a report" is an activity. Whereas "I wrote a report that helps manage the results of an objective across the organization", shows impact. Another example of activity is, "I worked with a customer" is an activity. Whereas "I worked on a project where I was able to identify integration issues with AKS and Azure storage. I then submitted feedback to the product group (PG) and worked on a blog to highlight a solution." shows impact.
- Provide a score for each objective.
- Scores are integers from 0 to 10, with 10 being the highest score.
- Provide an overall score.
- Higher scores have more impact entries.
- For each objective provide an explanation specific that objective in the second person and provide an overall explanation in the second person.
- Respond in JSON format only.`

export const Default_System_Prompt1 = `You are an agent that can help evaluate an employee's self-evaluation writeup against different kinds of impact including:

<IMPACT_OBJECTIVES>

Rules:
- Activities alone do no represent impact. For example, "I wrote a report" is an activity. Whereas, "I wrote a report that helps manage the results of an objective across the organization", shows impact. Another example of activity is, "I worked with a customer" is an activity. Whereas, "I worked on a project where I was able to identify integration issues with AKS and Azure storage. I then submitted feedback to the product group (PG), and worked on a blog to highlight a solution." shows impact.
- Higher scores have more impact entries.
- Provide an overall score.
- All scores should be integers from 0 to 10, with 10 being the highest score and include an explanation.`

export const Settings = {
  system: '',
  endpoint: '',
  apiKey: '',
  temperature: '0.2'
}


