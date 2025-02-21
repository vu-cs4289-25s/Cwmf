export default function ShowSubmissionsStage(props) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="text-center pt-8 pb-0">
        <h1 className="text-center text-4xl py-5">Round {props.currentRound}</h1>
        <h3 className="text-2xl">Theme: {props.theme}</h3>
      </div>
      <div className="text-center pt-30 pb-0">
        <h1 className="text-center text-8xl py-5">{props.prompt}</h1>
      </div>
      <div className="flex flex-col mt-10 space-y-5 items-center justify-center">
        {props.answers.map((answer, index) => (
          <div key={index} className="bg-gray-300 w-3/4 rounded-md p-3">
            <p className="text-2xl">{answer}</p>
          </div>
        ))}
      </div>
      <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
        Everyone&apos;s done!
      </button>
    </div>
  );
}
