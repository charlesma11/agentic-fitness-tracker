'use client';

import { useState, useEffect, useRef } from 'react';
import AnalysisDashboard from '@/app/components/AnalysisDashboard';
import { commonExercises } from '@/lib/exercises';

// --- Interfaces ---
interface Workout { id: number; name: string; reps: number; sets: number; weight: number; createdAt: string; }
interface Meal { id: number; name: string; calories: number; protein: number; createdAt: string; }
interface Bodyweight { id: number; weight: number; createdAt: string; }
type EditableItem = (Workout & { type: 'workout' }) | (Meal & { type: 'meal' }) | (Bodyweight & { type: 'bodyweight' });

// --- Helper Components ---
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-4 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-3">{title}</h2>
    {children}
  </div>
);
const FormToggleButton = ({ isVisible, onClick, children }: { isVisible: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className="text-sm font-medium text-blue-500 hover:text-blue-700">{isVisible ? 'Cancel' : children}</button>
);
const VoiceButton = ({ onClick, isRecording, children }: { onClick: () => void, isRecording: boolean, children: React.ReactNode }) => (
    <button onClick={onClick} className={`flex items-center gap-2 text-sm font-medium ${isRecording ? 'text-red-500' : 'text-green-500 hover:text-green-700'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        {isRecording ? 'Stop' : children}
    </button>
);

// --- Main Component ---
export default function Home() {
  const [todaysWorkouts, setTodaysWorkouts] = useState<Workout[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [allBodyweights, setAllBodyweights] = useState<Bodyweight[]>([]);

  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [name, setName] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [isWorkoutRecording, setIsWorkoutRecording] = useState(false);
  const [isMealRecording, setIsMealRecording] = useState(false);
  const [isJournalRecording, setIsJournalRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [mealTranscribedText, setMealTranscribedText] = useState('');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [finalJournalTranscript, setFinalJournalTranscript] = useState('');

  const fetchAllData = () => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`http://localhost:3001/workouts`).then(res => res.json()).then(data => {
        const workoutsData = data.data || [];
        setAllWorkouts(workoutsData);
        setTodaysWorkouts(workoutsData.filter((w: Workout) => w.createdAt === today));
    });
    fetch(`http://localhost:3001/meals`).then(res => res.json()).then(data => {
        setTodaysMeals((data.data || []).filter((m: Meal) => m.createdAt === today));
    });
    fetch(`http://localhost:3001/bodyweight`).then(res => res.json()).then(data => setAllBodyweights(data.data || []));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const addWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    const newWorkout = { name, reps: parseInt(reps), sets: parseInt(sets), weight: parseInt(weight) };
    fetch('http://localhost:3001/workouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newWorkout) })
      .then(() => {
        setName(''); setReps(''); setSets(''); setWeight(''); setTranscribedText('');
        setShowWorkoutForm(false);
        fetchAllData();
      });
  };
  const addMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeal = { name: mealName, calories: parseInt(calories), protein: parseInt(protein) };
    fetch('http://localhost:3001/meals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMeal) })
      .then(() => {
        setMealName(''); setCalories(''); setProtein(''); setMealTranscribedText('');
        setShowMealForm(false);
        fetchAllData();
      });
  };
  const addBodyweight = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = { weight: parseInt(bodyweight), createdAt: new Date().toISOString().slice(0, 10) };
    fetch('http://localhost:3001/bodyweight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEntry) })
    .then(() => {
      setBodyweight('');
      setShowWeightForm(false);
      fetchAllData();
    });
  };
  const updateItem = (item: EditableItem) => {
    const url = `http://localhost:3001/${item.type}s/${item.id}`;
    fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
    .then(() => {
        closeModal();
        fetchAllData();
    });
  };
  const deleteItem = (item: EditableItem) => {
      if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return;
      const url = `http://localhost:3001/${item.type}s/${item.id}`;
      fetch(url, { method: 'DELETE' }).then(() => fetchAllData());
  };

  const handleVoiceRecording = (type: 'workout' | 'meal') => {
    if(type === 'workout') setShowWorkoutForm(true);
    if(type === 'meal') setShowMealForm(true);

    const isRecording = type === 'workout' ? isWorkoutRecording : isMealRecording;
    const setIsRecording = type === 'workout' ? setIsWorkoutRecording : setIsMealRecording;
    const setTranscript = type === 'workout' ? setTranscribedText : setMealTranscribedText;
    const parseFunc = type === 'workout' ? parseWorkoutWithAI : parseMealWithAI;

    if (isRecording) { recognitionRef.current?.stop(); return; }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Web Speech API not supported.");
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e: any) => { console.error("Speech Recognition Error:", e); setIsRecording(false);};
    recognition.onresult = (event: any) => { 
        setTranscript(`Heard: "${event.results[0][0].transcript}"`);
        parseFunc(event.results[0][0].transcript); 
    };
    recognition.start();
  };

  const handleJournalVoiceRecording = () => { /* ... */ };
  const submitJournal = () => { /* ... */ };
  const parseWorkoutWithAI = async (transcript: string) => { /* ... */ };
  const parseMealWithAI = async (transcript: string) => { /* ... */ };
  const parseJournalWithAI = async (transcript: string) => { /* ... */ };

  const openModal = (item: EditableItem) => { setEditingItem(item); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (!editingItem) return; setEditingItem({ ...editingItem, [e.target.name]: e.target.value }); };

  return (
    <>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 font-sans text-zinc-800 dark:text-zinc-200">
        <header className="bg-white dark:bg-zinc-800 shadow-md p-4">
            <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-50">Agentic Fitness Tracker</h1>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-4 sm:p-8">
          <div className="lg:col-span-3">
            <AnalysisDashboard allWorkouts={allWorkouts} allBodyweights={allBodyweights} />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="text-center">
                <button onClick={() => { setJournalText(''); setFinalJournalTranscript(''); setIsJournalModalOpen(true); }} className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold shadow-lg hover:bg-purple-700 transition">
                Log Full Journal Entry
                </button>
            </div>
            <Section title="Log Workout">
              <div className="flex justify-between items-center">
                <FormToggleButton isVisible={showWorkoutForm} onClick={() => setShowWorkoutForm(!showWorkoutForm)}>Add Manually</FormToggleButton>
                <VoiceButton isRecording={isWorkoutRecording} onClick={() => handleVoiceRecording('workout')}>Add by Voice</VoiceButton>
              </div>
              {showWorkoutForm && (
                <div className="mt-4">
                  {transcribedText && <p className="mb-4 text-center text-sm text-zinc-500">{transcribedText}</p>}
                  <form onSubmit={addWorkout} className="grid grid-cols-2 gap-4">
                    <input list="common-exercises" type="text" placeholder="Exercise Name" value={name} onChange={e => setName(e.target.value)} className="col-span-2 w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                    <datalist id="common-exercises">{commonExercises.map(ex => <option key={ex} value={ex} />)}</datalist>
                    <input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                    <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                    <input type="number" placeholder="Weight (lbs)" value={weight} onChange={e => setWeight(e.target.value)} className="col-span-2 w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                    <button type="submit" className="col-span-2 w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save Workout</button>
                  </form>
                </div>
              )}
            </Section>
            <Section title="Log Meal">
                <div className="flex justify-between items-center">
                    <FormToggleButton isVisible={showMealForm} onClick={() => setShowMealForm(!showMealForm)}>Add Manually</FormToggleButton>
                    <VoiceButton isRecording={isMealRecording} onClick={() => handleVoiceRecording('meal')}>Add by Voice</VoiceButton>
                </div>
                {showMealForm && (
                    <div className="mt-4">
                        {mealTranscribedText && <p className="mb-4 text-center text-sm text-zinc-500">{mealTranscribedText}</p>}
                        <form onSubmit={addMeal} className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Meal Name" value={mealName} onChange={e => setMealName(e.target.value)} className="col-span-2 w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                            <input type="number" placeholder="Calories" value={calories} onChange={e => setCalories(e.target.value)} className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                            <input type="number" placeholder="Protein (g)" value={protein} onChange={e => setProtein(e.target.value)} className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                            <button type="submit" className="col-span-2 w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save Meal</button>
                        </form>
                    </div>
                )}
            </Section>
            <Section title="Track Weight">
                <FormToggleButton isVisible={showWeightForm} onClick={() => setShowWeightForm(!showWeightForm)}>Log New Weight</FormToggleButton>
                {showWeightForm && (
                <form onSubmit={addBodyweight} className="mt-4 flex gap-4">
                    <input type="number" placeholder="Current Weight (lbs)" value={bodyweight} onChange={e => setBodyweight(e.target.value)} className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save</button>
                </form>
                )}
                <ul className="mt-4 space-y-2">
                {allBodyweights.slice(0, 5).map(bw => (
                    <li key={bw.id} className="flex justify-between p-3 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm">
                        <div>{bw.weight} lbs</div>
                        <div className="text-zinc-500 dark:text-zinc-400">{bw.createdAt}</div>
                        <div className="flex gap-2">
                            <button onClick={() => openModal({...bw, type: 'bodyweight'})} className="font-medium text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => deleteItem({...bw, type: 'bodyweight'})} className="font-medium text-red-500 hover:red-700">Delete</button>
                        </div>
                    </li>
                ))}
                </ul>
            </Section>
            <div>
              <h2 className="text-xl font-semibold text-center mb-4">Today's Summary</h2>
              <div>
                  <h3 className="text-lg font-semibold mb-2">Workouts</h3>
                  <ul className="space-y-2">{todaysWorkouts.map(w => <li key={w.id} className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg bg-white dark:bg-zinc-800 shadow text-sm"><div><div className="font-bold">{w.name}</div><div className="text-zinc-400 text-xs">{w.createdAt}</div></div><div className="text-center">{w.sets}x{w.reps} @ {w.weight}lbs</div><div className="flex gap-2 justify-end"><button onClick={() => openModal({...w, type: 'workout'})} className="text-blue-500 text-xs">Edit</button><button onClick={() => deleteItem({...w, type: 'workout'})} className="text-red-500 text-xs">Del</button></div></li>)}</ul>
              </div>
              <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Meals</h3>
                  <ul className="space-y-2">{todaysMeals.map(m => <li key={m.id} className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg bg-white dark:bg-zinc-800 shadow text-sm"><div><div className="font-bold">{m.name}</div><div className="text-zinc-400 text-xs">{m.createdAt}</div></div><div className="text-center">{m.calories}kcal, {m.protein}g protein</div><div className="flex gap-2 justify-end"><button onClick={() => openModal({...m, type: 'meal'})} className="text-blue-500 text-xs">Edit</button><button onClick={() => deleteItem({...m, type: 'meal'})} className="text-red-500 text-xs">Del</button></div></li>)}</ul>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* ... Modals ... */}
    </>
  );
}
