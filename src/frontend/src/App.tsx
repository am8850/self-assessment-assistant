import { createEffect, createSignal } from 'solid-js'
import axios from 'axios'
import { makePersisted } from '@solid-primitives/storage'
import { Spinner, SpinnerType } from 'solid-spinner'
import { IoInformationCircleOutline } from 'solid-icons/io'
import { FaRegularTrashCan, FaSolidTemperatureThreeQuarters } from 'solid-icons/fa'
import {
  encode,
} from 'gpt-tokenizer'
import { ICompletion, IScores } from './interfaces'
import { BadSample, Default_System_Prompt, GoodSample, Labels, Settings, TokenCounts } from './settings'
import { AiOutlineCloseSquare, AiOutlineEdit } from 'solid-icons/ai'

const DEFAULT_SCORES: IScores = {
  overallScore: 0,
  overallExplanation: '',
  // individualImpact: { score: 0, explanation: '' },
  // helpingOthers: { score: 0, explanation: '' },
  // leveragingOthers: { score: 0, explanation: '' },
  // dni: { score: 0, explanation: '' },
  // other: { score: 0, explanation: '' },
  objectives: [{
    keyword: 'indiviual',
    title: 'Individual Results',
    score: 0,
    explanation: 'Individual accomplishments that have contributed to the overall company success.',
    scoreExplanation: ''
  }, {
    keyword: 'collaboration',
    title: 'Collaborative Results',
    score: 0,
    explanation: 'Efforts that have helped others be successful.',
    scoreExplanation: ''
  }]
}


function App() {

  const [settings, setSettings] = makePersisted(createSignal(Settings))
  const [text, setText] = makePersisted(createSignal(''))
  const [processing, setProcessing] = createSignal(false)
  const [scores, setScores] = makePersisted(createSignal<IScores>(DEFAULT_SCORES))
  const [tokenCounts, setTokenCounts] = createSignal(TokenCounts)
  const [popup, setPopup] = createSignal(false)
  const [helpPrompt, setHelpPrompt] = createSignal('')
  const [helpResponse, setHelpResponse] = createSignal('')
  const [helpProcessing, setHelpProcessing] = createSignal(false)
  const [newObjective, setNewObjective] = createSignal('')
  const [newKeyword, setNewKeyword] = createSignal('')

  let loadedOnce = false
  createEffect(() => {
    if (loadedOnce) return
    updateCounts(text())
    loadedOnce = true
  })

  const ResetScores = () => {
    const resetScores = { ...scores() }
    resetScores.overallScore = 0
    resetScores.overallExplanation = ''
    resetScores.objectives.forEach(area => {
      area.score = 0
      area.scoreExplanation = ''
    });
    setScores(resetScores)
  }

  const ResetSettings = () => {
    const oldSettings = settings()
    let newSettings = Settings
    newSettings.endpoint = oldSettings.endpoint
    newSettings.apiKey = oldSettings.apiKey
    setSettings(newSettings)
    setText('')
    setScores(DEFAULT_SCORES)
  }

  const showMessage = (msg: string) => {
    alert(msg)
  }

  const getFullPrompt = () => {
    let impactStatements = ''
    scores().objectives.forEach(objective => {
      impactStatements += `${objective.keyword}: ${objective.explanation}\n`
    })

    let systemPrompt = `${Default_System_Prompt.replace("<IMPACT_OBJECTIVES>", impactStatements)}`
    //systemPrompt += `\n\n${settings().system}`

    if (settings().system && settings().system !== '') {
      systemPrompt += `\n- ${settings().system}`
    }

    let finalResponseFormat = `{
      "overallScore": 0,
      "overallExplanation": "",`

    scores().objectives.forEach(area => {
      finalResponseFormat += `\n"${area.keyword}": {
        "score": ${area.score},
        "explanation": "" // Provide a score explanation for ${area.title}
      },`
    })
    // Remove the final comma
    finalResponseFormat = finalResponseFormat.slice(0, -1)
    finalResponseFormat += `}`

    systemPrompt += `\n\nuser:\n\n` + text() + `\n\nYou must respond in the following JSON:\n${finalResponseFormat}`

    console.info(`Prompt:\n${systemPrompt}`)

    return systemPrompt
  }

  const updateCounts = (text: string) => {
    setText(text)
    const input = encode(getFullPrompt()).length
    setTokenCounts({ input, output: tokenCounts().output, total: tokenCounts().total })
  }

  const ProcessHelpPrompt = async () => {
    if (helpProcessing()) return
    try {
      if (!helpPrompt() || helpPrompt() === '') {
        alert('Please provide a writeup to score')
        return
      }
      setHelpProcessing(true)
      const messages = [{ role: "user", content: helpPrompt() }]
      const payload = {
        messages,
        temperature: parseFloat(settings().temperature),
      }
      let resp = await axios.post<ICompletion>(settings().endpoint, payload, {
        headers: {
          'api-key': `${settings().apiKey}`
        }
      })
      setHelpResponse(resp.data.choices[0].message.content)
    } catch (error) {
      alert('An error has occured in processing your request. Please try again.')
      console.error(error)
    } finally {
      setHelpProcessing(false)
    }
  }

  const ProcessObjective = () => {
    if (newObjective() === '') {
      alert('Please provide an objective title')
      return
    }
    if (newKeyword() === '') {
      alert('Please provide an objective keyword')
      return
    }
    let newObjectives = scores().objectives
    newObjectives.push({
      title: newObjective(),
      keyword: newKeyword(),
      score: 0,
      explanation: '',
      scoreExplanation: ''
    })
    setScores({ ...scores(), objectives: newObjectives })
    setNewObjective('')
    setNewKeyword('')
  }

  const RemoveObjective = (title: string) => {
    if (title && confirm('Are you sure you want to remove: ' + title + '?')) {
      const newObjectives = scores().objectives.filter(area => area.title !== title)
      setScores({ ...scores(), objectives: newObjectives })
    }
  }

  const Process = async () => {
    if (processing()) return

    // Text and prompts are required
    if (!text() || text() === '') {
      alert('Please provide a writeup to score')
      return
    }
    // if (!settings().system || settings().system === '') {
    //   alert('Please provide a system prompt')
    //   return
    // }
    if (!settings().endpoint || settings().endpoint === '') {
      alert('Azure AI endpoint is required')
      return
    }
    if (!settings().apiKey || settings().apiKey === '') {
      alert('Azure AI key is required')
      return
    }

    try {
      ResetScores()
      setProcessing(true)
      const messages = [{ role: "system", content: getFullPrompt() }]
      const payload = {
        messages,
        temperature: parseFloat(settings().temperature),
      }
      //console.info("Prompt:", JSON.stringify(payload, null, 2))
      let resp = await axios.post<ICompletion>(settings().endpoint, payload, {
        headers: {
          'api-key': `${settings().apiKey}`
        }
      })
      let rawJson = resp.data.choices[0].message.content
      rawJson = rawJson.replace("```json", "").replace("```", "")

      const result = JSON.parse(rawJson)
      if (scores) {
        console.info('Response:', rawJson)
        const payload = { ...scores() }
        payload.overallScore = result.overallScore
        payload.overallExplanation = result.overallExplanation
        payload.objectives.forEach(objective => {
          const items = result[objective.keyword]
          if (items) {
            objective.score = items.score
            objective.scoreExplanation = items.explanation
          }
        })

        console.log("Completion:\n", JSON.stringify(payload, null, 2))
        setScores(payload)
        setTokenCounts(
          {
            input: tokenCounts().input,
            output: resp.data.usage.completion_tokens,
            total: resp.data.usage.total_tokens
          })

      }
      else
        throw new Error('Unable to parse the response:\n' + rawJson)
    } catch (error) {
      showMessage('An error occurred while processing the request')
      console.error(error)
    }
    finally {
      setProcessing(false)
      console.log('Process completed')
    }
  }

  const updateExplanation = (objective: string, evt: any) => {
    const oldScores = scores()
    const items = oldScores.objectives.filter(area => area.title === objective)
    const item = items[0]
    if (item) {
      item.explanation = evt.currentTarget.value
      setScores(oldScores)
    }
  }

  return (
    <>
      <header class='bg-slate-950 text-white flex h-[36px] items-center'>
        <div class='w-full'>
          <h1 class='font-semibold px-2 text-xl'>Self-Evaluation Writing Assistant</h1>
        </div>
        <div>
          {/* <button
            class='font-semibold w-20 hover:underline'
            onclick={() => { document.location.href = 'https://localhost/.auth/logout' }}
          >Sign Out</button> */}
        </div>
      </header>
      <section class='bg-slate-900 text-white flex px-2 h-[36px] items-center space-x-2'>
        <label onClick={() => showMessage(Labels.endpointTitle)}>{Labels.endpoint}: <IoInformationCircleOutline class='inline-block' title={Labels.endpointTitle} />
        </label>
        <input type='password' class='text-black outline-none px-1 w-80' placeholder='Full OpenAI Endpoint'
          oninput={(e) => setSettings({ ...settings(), endpoint: e.currentTarget.value })}
          value={settings().endpoint}
        />
        <label onclick={() => showMessage('Please provide an OpenAI key')}>{Labels.apiKey}: <IoInformationCircleOutline class='inline-block' title='Please provide an OpenAI key' /></label>
        <input type='password' class='text-black outline-none px-1 w-40' placeholder='OpenAI Key'
          oninput={(e) => setSettings({ ...settings(), apiKey: e.currentTarget.value })}
          value={settings().apiKey}
        />
        <label>{Labels.temperature}: <FaSolidTemperatureThreeQuarters class='inline-block' /></label>
        <input type='text' class='w-20 text-black px-1'
          oninput={(e) => setSettings({ ...settings(), temperature: e.currentTarget.value })}
          value={settings().temperature}
        />
        <button class='bg-orange-700 hover:bg-orange-600 text-white px-1 font-semibold'
          onclick={ResetSettings}
        >{Labels.reset}</button>

      </section>
      {/* <section class='h-[120px] bg-slate-800 flex flex-wrap'>
        <div class='w-1/6 p-[7px] flex flex-col space-y-1'>
          <label>System Prompt</label>
          <textarea class='h-full resize-none p-1' />
        </div>
        <div class='w-1/6'>System Prompt</div>
        <div class='w-1/6'>System Prompt</div>
        <div class='w-1/6'>System Prompt</div>
        <div class='w-1/6'>System Prompt</div>
        <div class='w-1/6'>System Prompt</div>
      </section> */}
      <div class='bg-slate-300 dark:bg-slate-700 dark:text-white flex h-[calc(100vh-36px-36px-32px)]'>
        <main class='w-1/2 p-4 flex flex-col'>
          <div class="flex items-center mb-2">
            <div class=' flex-grow'>
              <label><span class='uppercase font-semibold'>Input Tokens:</span> <span class='bg-blue-600 text-white px-2 rounded-xl'>{tokenCounts().input}</span></label>
            </div>
            <button class='bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 p-2'
              onclick={Process}
            >{!processing() && <span>{Labels.score}</span>} {processing() && <><span>Evaluating</span> <Spinner type={SpinnerType.puff} color="white" height={25} class='inline-block' /></>}</button>
          </div>
          <div>
            <button class='text-blue-600 dark:text-blue-200 hover:underline'
              onclick={() => setPopup(true)}
            ><AiOutlineEdit class='inline-block' /> Help me write it</button>
          </div>
          <textarea class='w-full h-full outline-none p-2 dark:bg-slate-800 dark:text-white resize-none'
            placeholder='Write your looking back section here...'
            oninput={(e) => updateCounts(e.currentTarget.value)}
            value={text()}
          ></textarea>
        </main>
        <aside class='w-1/2 bg-slate-50 flex flex-col p-2 space-y-2 overflow-auto dark:text-white dark:bg-slate-600'>
          <div class="flex space-x-2 w-full">
            <div class="flex w-full">
              <label class='ml-auto text-2xl'>Overall score: <span class='bg-blue-600 text-white px-2 rounded-xl'>{scores().overallScore}/10</span></label>
            </div>
          </div>
          <div class="flex space-x-2 text-sm w-full">
            <div class="w-ful space-x-2">
              <label class='uppercase font-semibold'>Samples:</label>
              <button class='text-blue-600 hover:underline dark:text-blue-200'
                onclick={() => setText(BadSample)}
              >Bad</button>
              <span>|</span>
              <button class='text-blue-600 hover:underline dark:text-blue-200'
                onclick={() => setText(GoodSample)}
              >Better</button>
            </div>
          </div>
          <table>
            <thead>
              <tr class='bg-slate-900 text-white'>
                <th>Impact Area</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {scores().objectives.map(area => (
                <tr>
                  <td>{area.title}</td>
                  <td class='text-center'>{area.score}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
          {scores().overallExplanation && <>
            <label class='font-semibold uppercase'>Summary:</label>
            <textarea class='p-1 bg-slate-200 resize-none dark:bg-slate-400 dark:text-black min-h-[100px]' readOnly rows={4} value={scores().overallExplanation}></textarea>
          </>
          }
          <label class='bg-slate-800 text-white px-2 py-1 font-semibold'>Additional role and level objectives:</label>
          <div class='space-x-2 text-sm'>
            <label class='uppercase font-semibold'>Samples:</label>
            <button class='text-blue-600 hover:underline dark:text-blue-200'
              onclick={() => setSettings({ ...settings(), system: Labels.PM })}
            >PM</button>
            <label>|</label>
            <button class='text-blue-600 hover:underline dark:text-blue-200'
              onclick={() => setSettings({ ...settings(), system: Labels.consultant })}
            >Consultant</button>
            <label>|</label>
            <button class='text-blue-600 hover:underline dark:text-blue-200'
              onclick={() => setSettings({ ...settings(), system: Labels.Engineer })}
            >Engineer</button></div>
          <textarea
            oninput={(e) => setSettings({ ...settings(), system: e.currentTarget.value })}
            value={settings().system}
            class='resize-none p-1 min-h-[100px] outline-none dark:bg-slate-800 dark:text-white'
            rows={5} />
          <div class="flex space-x-2">
            <label class='font-semibold text-white uppercase'>New Objective:</label>
            <input type='text' class='flex-grow p-1 text-black outline-none' placeholder='Objective title'
              oninput={(e) => setNewObjective(e.currentTarget.value)}
              value={newObjective()}
            />
            <input type='text' class='w-28 p-1 text-black outline-none' placeholder='Keyword'
              oninput={(e) => setNewKeyword(e.currentTarget.value)}
              value={newKeyword()}
            />
            <button class='w-10 dark:bg-slate-700 dark:text-white' title='Add area'
              onclick={ProcessObjective}
            >+</button>
          </div>
          {scores().objectives.map(objective => (
            <div class='flex flex-col p-1'>
              <div class="flex dark:bg-slate-800 dark:text-white items-center p-1 space-x-2">
                <button class='bg-red-600 p-1'><FaRegularTrashCan class='inline-block'
                  onclick={() => RemoveObjective(objective.title)}
                /></button>
                <label class='flex-grow'>{objective.title}</label>
                <label>Score: <span class='bg-blue-600 px-2 rounded-xl text-white'>{objective.score}/10</span></label>
              </div>
              <div class='flex'>
                <div class='w-1/2 mr-1'>
                  <label>Objective Explanation:</label>
                  <textarea class='w-full min-h-[100px] p-1 resize-none outline-none text-black'
                    oninput={(e) => { updateExplanation(objective.title, e) }}
                    value={objective.explanation}
                  />
                </div>
                <div class='w-1/2 ml-1'>
                  <label>Score Explanation:</label>
                  <textarea readOnly class='w-full min-h-[100px] p-1 resize-none outli-none bg-slate-800 text-white'
                    value={objective.scoreExplanation}
                  />
                </div>
              </div>
            </div>
          ))}
          {/* <ImpactArea title='Individual Impact' setSettings={setSettings} settings={settings} scores={scores} propName='individualImpact' /> */}
          {/* <ImpactArea title='Individual Impact' setSettings={setSettings} settings={settings} scores={scores} propName='individualImpact' />
          <ImpactArea title='Contributed to success of others' setSettings={setSettings} settings={settings} scores={scores} propName='helpingOthers' />
          <ImpactArea title='Build on the work of others' setSettings={setSettings} settings={settings} scores={scores} propName='leveragingOthers' />
          <ImpactArea title='D&I Impact' setSettings={setSettings} settings={settings} scores={scores} propName='dni' /> */}
        </aside>

      </div>
      {popup() &&

        <div class='absolute flex top-[85px] left-[25px] w-[calc(100vw-50px)] max-h-[calc(100vh-50px)] bg-slate-100 dark:bg-slate-700 shadow-xl shadow-black'>
          <div class='flex flex-col dark:text-white w-full space-y-2'>
            <nav class='bg-slate-800 p-1 w-full flex'>
              <label
                class='ml-auto text-white'
                onclick={() => setPopup(false)}
              ><AiOutlineCloseSquare class='inline-block' /></label>
            </nav>
            <div class="p-2 flex flex-col space-y-2">
              <label class='uppercase font-semibold'>Prompt:</label>
              <div class='space-x-2'>
                <label class='uppercase font-semibold text-sm'>SAMPLES:</label>
                <button class='text-blue-600 dark:text-blue-200 hover:underline'
                  onclick={() => setHelpPrompt(`Re-write for clarity:\n\nI worked on a project where I was able to identify integration issues with AKS and Azure storage. I then submitted feedback to the product group (PG), and worked on a blog to highlight a solution.`)}
                >Re-write for clarity</button>
                <label>|</label>
                <button class='text-blue-600 dark:text-blue-200 hover:underline'
                  onclick={() => setHelpPrompt(`Re-write for impact and expand:\n\nI worked on a project where I was able to identify integration issues with AKS and Azure storage. I then submitted feedback to the product group (PG), and worked on a blog to highlight a solution.`)}
                >Re-write for impact</button>
              </div>
              <textarea
                oninput={(e) => setHelpPrompt(e.currentTarget.value)}
                value={helpPrompt()}
                class='p-1 outline-none  dark:bg-slate-800 dark:text-white' rows={5}></textarea>
            </div>

            <div class="p-2 flex flex-col">
              <label class='uppercase font-semibold'>Completion:</label>
              <textarea
                value={helpResponse()}
                class='p-1 outline-none bg-slate-200 dark:bg-slate-400 dark:text-black' rows={6} readOnly></textarea>
            </div>

            <hr class='border-black dark:border-slate-500' />
            <section class='flex'>
              <div class='mx-auto space-x-4 p-2'>
                <button class='bg-blue-600 text-white p-2 mx-auto hover:bg-blue-500'
                  onclick={ProcessHelpPrompt}
                >Process {helpProcessing() && <Spinner type={SpinnerType.puff} color="white" height={25} class='inline-block' />}</button>
                {/* <button class='bg-blue-600 text-white p-2 mx-auto'>Insert</button> */}
                <button class='bg-slate-800 hover:bg-blue-500 text-white p-2 mx-auto'
                  onclick={() => setPopup(false)}
                >Close</button>
              </div>
            </section>
          </div>
        </div>
      }

      {/* <div id="popup-modal" tabindex="-1" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative p-4 w-full max-w-md max-h-full">
          <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="popup-modal">
              <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
            <div class="p-4 md:p-5 text-center">
              <svg class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this product?</h3>
              <button data-modal-hide="popup-modal" type="button" class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
                Yes, I'm sure
              </button>
              <button data-modal-hide="popup-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">No, cancel</button>
            </div>
          </div>
        </div>
      </div> */}


      <footer class='h-[32px] bg-slate-900 flex text-white items-center px-2 space-x-2'>
        {processing() && <Spinner type={SpinnerType.puff} color="white" height={25} />}
        {/* {processing() && <label>Processing</label>} */}
        <label>Last Total Tokens: <span class='bg-blue-600 text-white px-1 rounded-xl'>{tokenCounts().total}</span></label>
        <label class='font-semibold uppercase'>| Issues: </label>
        <a href='https://github.com/am8850/self-evaluation-assistant/issues' target='_blank' class='hover:underline'>Github - am8850</a>
        <label class='font-semibold uppercase'>| </label>
        <button class='hover:underline text-white' title={'Your data is sent securely for processing.\Your data is not used for any purpose.\nNo one but you can see the results.\nThe settings are stored in your own system.'}><IoInformationCircleOutline class='inline-block' /> Privacy Information</button>
      </footer>
    </>
  )
}

export default App

