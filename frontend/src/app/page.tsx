'use client';

import { useState, useEffect, useRef } from 'react';

// --- Interfaces ---
interface Workout { id: number; name: string; reps: number; sets: number; weight: number; createdAt: string; }
interface Meal { id: number; name: string; calories: number; protein: number; createdAt: string; }
interface Bodyweight { id: number; weight: number; createdAt: string; }
type EditableItem = (Workout & { type: 'workout' }) | (Meal & { type: 'meal' }) | (Bodyweight & { type: 'bodyweight' });

// --- Helper Components ---
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-8 p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
    <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">{title}</h2>
    {children}
  </div>
);

const FormToggleButton = ({ isVisible, onClick, children }: { isVisible: boolean, onClick: () => void, children: React.ReactNode }) => (
  <button onClick={onClick} className="text-sm font-medium text-blue-500 hover:text-blue-700">
    {isVisible ? 'Cancel' : children}
  </button>
);

const VoiceButton = ({ onClick, isRecording }: { onClick: () => void, isRecording: boolean }) => (
    <button onClick={onClick} disabled={isRecording} className={`flex items-center gap-2 text-sm font-medium ${isRecording ? 'text-red-500' : 'text-green-500 hover:text-green-700'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        {isRecording ? 'Listening...' : 'Add by Voice'}
    </button>
);


// --- Main Component ---
export default function Home() {
  // --- State ---
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [bodyweights, setBodyweights] = useState<Bodyweight[]>([]);

  // Form Visibility
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  
  // Voice & Modal State
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [mealTranscribedText, setMealTranscribedText] = useState('');
  const recognitionRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);

  // --- Effects ---
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`http://localhost:3001/workouts?date=${today}`).then(res => res.json()).then(data => setWorkouts(data.data || []));
    fetch(`http://localhost:3001/meals?date=${today}`).then(res => res.json()).then(data => setMeals(data.data || []));
    fetch(`http://localhost:3001/bodyweight`).then(res => res.json()).then(data => setBodyweights(data.data || []));
  }, []);

  // --- API Functions ---
  const addWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    const newWorkout = { name, reps: parseInt(reps), sets: parseInt(sets), weight: parseInt(weight) };
    fetch('http://localhost:3001/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWorkout),
    })
      .then(res => res.json())
      .then(data => {
        setWorkouts([...workouts, data.data]);
        setName(''); setReps(''); setSets(''); setWeight(''); setTranscribedText('');
        setShowWorkoutForm(false);
      });
  };

  const addMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeal = { name: mealName, calories: parseInt(calories), protein: parseInt(protein) };
    fetch('http://localhost:3001/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMeal),
    })
      .then(res => res.json())
      .then(data => {
        setMeals([...meals, data.data]);
        setMealName(''); setCalories(''); setProtein(''); setMealTranscribedText('');
        setShowMealForm(false);
      });
  };

  const addBodyweight = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = { weight: parseInt(bodyweight), createdAt: new Date().toISOString().slice(0, 10) };
    fetch('http://localhost:3001/bodyweight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    })
    .then(res => res.json())
    .then(data => {
      setBodyweights([data.data, ...bodyweights].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setBodyweight('');
      setShowWeightForm(false);
    });
  }
  
  const updateItem = (item: EditableItem) => {
    const url = `http://localhost:3001/${item.type}s/${item.id}`;
    fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    }).then(() => {
        if (item.type === 'workout') setWorkouts(workouts.map(i => i.id === item.id ? i : i));
        else if (item.type === 'meal') setMeals(meals.map(i => i.id === item.id ? i : i));
        else if (item.type === 'bodyweight') setBodyweights(bodyweights.map(i => i.id === item.id ? i : i));
        closeModal();
    });
  };

  const deleteItem = (item: EditableItem) => {
      if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return;
      const url = `http://localhost:3001/${item.type}s/${item.id}`;
      fetch(url, { method: 'DELETE' }).then(() => {
          if (item.type === 'workout') setWorkouts(workouts.filter(i => i.id !== item.id));
          else if (item.type === 'meal') setMeals(meals.filter(i => i.id !== item.id));
          else if (item.type === 'bodyweight') setBodyweights(bodyweights.filter(i => i.id !== item.id));
      });
  };
  
  // --- Modal Functions ---
  const openModal = (item: EditableItem) => { setEditingItem(item); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [e.target.name]: e.target.value });
  };
  
  // --- Voice & AI (omitted for brevity, they are unchanged) ---
  const parseWorkoutWithAI = async (transcript: string) => { setTranscribedText('Processing...'); try { const res = await fetch('/api/parse-workout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript }) }); if (!res.ok) throw new Error('AI failed'); const data = await res.json(); setName(data.name || ''); setReps(data.reps?.toString() || ''); setSets(data.sets?.toString() || ''); setWeight(data.weight?.toString() || ''); setTranscribedText(`Parsed: ${data.name}`); } catch (e) { setTranscribedText('Could not understand.'); }};
  const parseMealWithAI = async (transcript: string) => { setMealTranscribedText('Processing...'); try { const res = await fetch('/api/parse-meal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript }) }); if (!res.ok) throw new Error('AI failed'); const data = await res.json(); setMealName(data.name || ''); setCalories(data.calories?.toString() || ''); setProtein(data.protein?.toString() || ''); setMealTranscribedText(`Parsed: ${data.name}`); } catch (e) { setMealTranscribedText('Could not understand.'); }};
  const handleVoiceRecording = (type: 'workout' | 'meal') => { if(isRecording) { recognitionRef.current?.stop(); return; } const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SpeechRec) {alert('Web Speech API not supported.'); return;} const rec = new SpeechRec(); recognitionRef.current = rec; rec.continuous = false; rec.onstart = () => { setIsRecording(true); if(type === 'workout') setTranscribedText('Listening...'); else setMealTranscribedText('Listening...');}; rec.onend = () => setIsRecording(false); rec.onresult = e => { const transcript = e.results[0][0].transcript; if(e.results[0].isFinal) { if(type==='workout') parseWorkoutWithAI(transcript); else parseMealWithAI(transcript); }}; rec.start();};

  // --- Main Render ---
  return (
    <>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 font-sans text-zinc-800 dark:text-zinc-200">
        <main className="max-w-3xl mx-auto p-4 sm:p-6">
          <h1 className="text-4xl font-bold text-center mb-8">Fitness Tracker</h1>
          
          <Section title="Log Workout">
            <div className="flex justify-between items-center">
              <FormToggleButton isVisible={showWorkoutForm} onClick={() => setShowWorkoutForm(!showWorkoutForm)}>Add Manually</FormToggleButton>
              <VoiceButton isRecording={isRecording} onClick={() => { setShowWorkoutForm(true); handleVoiceRecording('workout'); }} />
            </div>
            {showWorkoutForm && (
              <div className="mt-4">
                {transcribedText && <p className="mb-4 text-center text-sm text-zinc-500">{transcribedText}</p>}
                <form onSubmit={addWorkout} className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Exercise Name" value={name} onChange={e => setName(e.target.value)} className="col-span-2 w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700"/>
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
                <VoiceButton isRecording={isRecording} onClick={() => { setShowMealForm(true); handleVoiceRecording('meal'); }} />
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
              {bodyweights.slice(0, 5).map(bw => (
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

          <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-semibold text-center">Today's Summary</h2>
              <div>
                  <h3 className="text-xl font-semibold mb-2">Workouts</h3>
                  <ul className="space-y-2">{workouts.map(w => <li key={w.id} className="flex justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 shadow"><div><div className="font-bold">{w.name}</div><div className="text-sm">{w.sets}x{w.reps} @ {w.weight}lbs</div></div><div className="flex gap-2"><button onClick={() => openModal({...w, type: 'workout'})} className="text-xs text-blue-500">Edit</button><button onClick={() => deleteItem({...w, type: 'workout'})} className="text-xs text-red-500">Del</button></div></li>)}</ul>
              </div>
              <div>
                  <h3 className="text-xl font-semibold mb-2">Meals</h3>
                  <ul className="space-y-2">{meals.map(m => <li key={m.id} className="flex justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 shadow"><div><div className="font-bold">{m.name}</div><div className="text-sm">{m.calories}kcal, {m.protein}g protein</div></div><div className="flex gap-2"><button onClick={() => openModal({...m, type: 'meal'})} className="text-xs text-blue-500">Edit</button><button onClick={() => deleteItem({...m, type: 'meal'})} className="text-xs text-red-500">Del</button></div></li>)}</ul>
              </div>
          </div>
        </main>
      </div>

      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Edit {editingItem.type}</h3>
            <div className="space-y-4">
                {editingItem.type === 'workout' && <>
                    <input name="name" value={editingItem.name} onChange={handleModalChange} className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                    <div className="grid grid-cols-3 gap-4">
                        <input name="sets" type="number" value={editingItem.sets} onChange={handleModalChange} placeholder="Sets" className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                        <input name="reps" type="number" value={editingItem.reps} onChange={handleModalChange} placeholder="Reps" className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                        <input name="weight" type="number" value={editingItem.weight} onChange={handleModalChange} placeholder="Weight" className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                    </div>
                </>}
                {editingItem.type === 'meal' && <>
                    <input name="name" value={editingItem.name} onChange={handleModalChange} className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="calories" type="number" value={editingItem.calories} onChange={handleModalChange} placeholder="Calories" className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                        <input name="protein" type="number" value={editingItem.protein} onChange={handleModalChange} placeholder="Protein" className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
                    </div>
                </>}
                {editingItem.type === 'bodyweight' && <input name="weight" type="number" value={editingItem.weight} onChange={handleModalChange} className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>}
              <input name="createdAt" type="date" value={editingItem.createdAt} onChange={handleModalChange} className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-700"/>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={closeModal} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-zinc-600 hover:bg-gray-300 dark:hover:bg-zinc-500">Cancel</button>
              <button onClick={() => updateItem(editingItem)} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
