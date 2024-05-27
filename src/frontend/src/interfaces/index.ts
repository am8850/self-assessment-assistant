export interface IImpactScore {
    overallScore: number,
    overallExplanation: string,
    individualImpact: {
        score: number
        explanation: string
    },
    helpingOthers: {
        score: number
        explanation: string
    },
    leveragingOthers: {
        score: number
        explanation: string
    },
    dni: {
        score: number
        explanation: string
    },
    other: {
        score: number
        explanation: string
    }
}

export interface IMessage {
    role: string
    content: string
}

export interface IChoice {
    index: number
    message: IMessage
}

export interface ICompletion {
    id: string
    mode: string
    choices: IChoice[]
    usage: {
        completion_tokens: number
        prompt_tokens: number
        total_tokens: number
    }
}

export interface IObjective {
    keyword: string,
    title: string,
    score: number,
    explanation: string
    scoreExplanation: string
}

export interface IScores {
    overallScore: number,
    overallExplanation: string,
    //individualImpact: areas[]
    objectives: IObjective[]
}