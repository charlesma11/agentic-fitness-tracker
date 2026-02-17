'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Workout { id: number; name: string; reps: number; sets: number; weight: number; createdAt: string; }
interface Bodyweight { id: number; weight: number; createdAt: string; }

// Brzycki formula for 1RM calculation
const calculate1RM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return weight / (1.0278 - 0.0278 * reps);
};

export default function AnalysisDashboard({ allWorkouts, allBodyweights }: { allWorkouts: Workout[], allBodyweights: Bodyweight[] }) {
    const [maxLifts, setMaxLifts] = useState<{ [key: string]: number }>({});
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        if (allWorkouts.length > 0) {
            const liftMaxes: { [key: string]: number } = {};
            const workoutHistory: { [date: string]: { [lift: string]: number } } = {};

            allWorkouts.forEach(w => {
                const oneRM = Math.round(calculate1RM(w.weight, w.reps));

                // Set true 1RM for each lift
                if (!liftMaxes[w.name] || oneRM > liftMaxes[w.name]) {
                    liftMaxes[w.name] = oneRM;
                }

                // Prepare data for chart, showing max 1RM for a given day
                if (!workoutHistory[w.createdAt]) {
                    workoutHistory[w.createdAt] = {};
                }
                if (!workoutHistory[w.createdAt][w.name] || oneRM > workoutHistory[w.createdAt][w.name]) {
                    workoutHistory[w.createdAt][w.name] = oneRM;
                }
            });
            
            setMaxLifts(liftMaxes);

            // Combine with bodyweight for charting
            const combinedData: { [date: string]: any } = {};
            Object.keys(workoutHistory).forEach(date => {
                if (!combinedData[date]) combinedData[date] = { date };
                Object.assign(combinedData[date], workoutHistory[date]);
            });

            allBodyweights.forEach(bw => {
                if (!combinedData[bw.createdAt]) combinedData[bw.createdAt] = { date: bw.createdAt };
                combinedData[bw.createdAt]['Bodyweight'] = bw.weight;
            });
            
            const sortedChartData = Object.values(combinedData).sort((a, b) => a.date.localeCompare(b.date));
            setChartData(sortedChartData);
        }
    }, [allWorkouts, allBodyweights]);
    
    const latestBw = allBodyweights[0]?.weight || 0;
    const uniqueLifts = Object.keys(maxLifts);

    return (
        <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg mt-8">
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-6">Analysis & Progress</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {uniqueLifts.map(lift => (
                    <div key={lift} className="p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-center">
                        <h3 className="text-lg font-bold">{lift}</h3>
                        <p className="text-3xl font-light">{maxLifts[lift]} lbs</p>
                        <p className="text-xs text-zinc-500">Est. 1RM</p>
                        {latestBw > 0 && <p className="text-sm text-purple-500 mt-1">{(maxLifts[lift] / latestBw).toFixed(2)}x Bodyweight</p>}
                    </div>
                ))}
            </div>

            <h3 className="text-xl font-semibold mb-4">Progress Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" stroke="#ff7300" />
                    <Tooltip />
                    <Legend />
                    {uniqueLifts.map((lift, index) => (
                        <Line key={lift} yAxisId="left" type="monotone" dataKey={lift} stroke={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} connectNulls />
                    ))}
                    <Line type="monotone" dataKey="Bodyweight" stroke="#ff7300" yAxisId="right" connectNulls/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
