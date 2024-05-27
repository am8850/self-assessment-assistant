import { IoInformationCircleOutline } from 'solid-icons/io'
const ImpactArea = (props: { title: string, setSettings: any, settings: any, propName: string, scores: any }) => {
    return (
        <>
            <div class="flex flex-col">
                <div class="bg-slate-800 text-white flex items-center px-2 space-x-2">
                    <label class='bg-slate-800 text-white p-1 w-full font-semibold'>{props.title}: </label>
                    <label>Score: </label>
                    <span class='bg-blue-600 px-2 rounded-xl  text-white'>{props.scores()[props.propName].score}/10</span>
                </div>

                <div class="flex">
                    <div class="flex w-1/2 flex-col p-1">
                        <label class='text-sm font-semibold uppercase'>Objective Explanation: <IoInformationCircleOutline class='inline-block' title='Edit the objective according to your role' /></label>
                        <textarea
                            oninput={(e: any) => props.setSettings({ ...props.settings(), [props.propName]: e.currentTarget.value })}
                            value={props.settings()[props.propName]}
                            class='resize-none min-h-[100px] p-1 outline-none dark:bg-slate-800 dark:text-white' rows={5}
                        />
                    </div>
                    <div class="flex flex-col w-1/2 p-1">
                        <label class='text-sm font-semibold uppercase'>Score Explanation:</label>
                        <textarea
                            class='bg-slate-200 min-h-[100px] p-1 outline-none dark:bg-slate-400 dark:text-black resize-none'
                            value={props.scores()[props.propName].explanation}
                            rows={5}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
export default ImpactArea;