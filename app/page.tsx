"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Task = {
  id: string;
  title: string;
  time: string;
  category: string;
  priority: string;
  done: boolean;
  missed: boolean;
  date: string;
  alerted?: boolean;
};

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Morning planning",
    time: "07:30",
    category: "Personal",
    priority: "Medium",
    done: false,
    missed: false,
    date: getToday(),
  },
  {
    id: "2",
    title: "Study / learning",
    time: "10:00",
    category: "Study",
    priority: "High",
    done: false,
    missed: false,
    date: getToday(),
  },
  {
    id: "3",
    title: "Exercise",
    time: "18:00",
    category: "Health",
    priority: "Medium",
    done: false,
    missed: false,
    date: getToday(),
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("Medium");
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);

  // Load saved tasks
  useEffect(() => {
    const savedTasks = localStorage.getItem("activity-tracker-tasks");

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(initialTasks);
    }

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      setAlertsEnabled(true);
    }
  }, []);

  // Save tasks
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(
        "activity-tracker-tasks",
        JSON.stringify(tasks)
      );
    }
  }, [tasks]);

  // Check task times
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      const currentTime = now.toTimeString().slice(0, 5);
      const currentDate = getToday();

      setTasks((previousTasks) => {
        return previousTasks.map((task) => {
          if (
            task.date === currentDate &&
            task.time === currentTime &&
            !task.done &&
            !task.alerted
          ) {
            playBeep();

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Task Reminder", {
                body: `${task.title} is due now.`,
              });
            }

            return {
              ...task,
              alerted: true,
            };
          }

          return task;
        });
      });
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Play beep
  function playBeep() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (!audioContext.current) {
        audioContext.current = new AudioContextClass();
      }

      const context = audioContext.current;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    } catch {
      console.log("Audio alert unavailable.");
    }
  }

  // Enable notifications
  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setAlertsEnabled(true);

      new Notification("Activity Tracker", {
        body: "Task alerts are now enabled.",
      });
    }
  }

  // Add task
  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      time,
      category,
      priority,
      done: false,
      missed: false,
      alerted: false,
      date: getToday(),
    };

    setTasks((previousTasks) =>
      [...previousTasks, newTask].sort((a, b) =>
        a.time.localeCompare(b.time)
      )
    );

    setTitle("");
  }

  // Complete task
  function toggleTask(taskId: string) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              done: !task.done,
              missed: false,
            }
          : task
      )
    );
  }

  // Delete task
  function deleteTask(taskId: string) {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== taskId)
    );
  }

  const todayTasks = tasks
    .filter((task) => task.date === getToday())
    .sort((a, b) => a.time.localeCompare(b.time));

  const statistics = useMemo(() => {
    const total = todayTasks.length;

    const completed = todayTasks.filter(
      (task) => task.done
    ).length;

    const missed = todayTasks.filter(
      (task) => task.missed
    ).length;

    const pending = total - completed - missed;

    const percentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      missed,
      pending,
      percentage,
    };
  }, [todayTasks]);

  return (
    <main className="max-w-6xl mx-auto p-5 md:p-8">

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">

        <div>
          <p className="text-sm text-gray-500">
            Personal productivity
          </p>

          <h1 className="text-3xl font-bold">
            My Activity Tracker
          </h1>

          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          onClick={enableNotifications}
          className="rounded-xl bg-black px-4 py-3 text-white"
        >
          {alertsEnabled
            ? "🔔 Alerts enabled"
            : "🔔 Enable alerts"}
        </button>

      </header>

      {/* Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <div className="card p-5">
          <div className="text-2xl">📋</div>
          <div className="text-2xl font-bold mt-2">
            {statistics.total}
          </div>
          <div className="text-sm text-gray-500">
            Total
          </div>
        </div>

        <div className="card p-5">
          <div className="text-2xl">✅</div>
          <div className="text-2xl font-bold mt-2">
            {statistics.completed}
          </div>
          <div className="text-sm text-gray-500">
            Completed
          </div>
        </div>

        <div className="card p-5">
          <div className="text-2xl">⏳</div>
          <div className="text-2xl font-bold mt-2">
            {statistics.pending}
          </div>
          <div className="text-sm text-gray-500">
            Pending
          </div>
        </div>

        <div className="card p-5">
          <div className="text-2xl">🔴</div>
          <div className="text-2xl font-bold mt-2">
            {statistics.missed}
          </div>
          <div className="text-sm text-gray-500">
            Missed
          </div>
        </div>

      </section>

      {/* Progress */}
      <section className="card p-5 mb-6">

        <div className="flex justify-between mb-2">
          <b>Today&apos;s progress</b>

          <b>
            {statistics.percentage}%
          </b>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

          <div
            className="h-full bg-black rounded-full transition-all"
            style={{
              width: `${statistics.percentage}%`,
            }}
          />

        </div>

      </section>

      {/* Main content */}
      <section className="grid lg:grid-cols-[1fr_360px] gap-6">

        {/* Tasks */}
        <div className="card p-5">

          <h2 className="text-xl font-bold mb-4">
            Today&apos;s activities
          </h2>

          <div className="space-y-3">

            {todayTasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No activities yet.
              </p>
            )}

            {todayTasks.map((task) => (

              <div
                key={task.id}
                className="border rounded-2xl p-4 flex gap-3 items-center"
              >

                <button
                  className="text-2xl"
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done ? "✅" : "⬜"}
                </button>

                <div className="flex-1">

                  <div
                    className={`font-semibold ${
                      task.done
                        ? "line-through text-gray-400"
                        : ""
                    }`}
                  >
                    {task.title}
                  </div>

                  <div className="text-sm text-gray-500">
                    {task.time} · {task.category} ·{" "}
                    {task.priority}
                  </div>

                </div>

                {task.missed && (
                  <span className="text-sm text-red-600 font-semibold">
                    MISSED
                  </span>
                )}

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>

              </div>

            ))}

          </div>

        </div>

        {/* Add task */}
        <form
          onSubmit={addTask}
          className="card p-5 h-fit"
        >

          <h2 className="text-xl font-bold mb-4">
            Add activity
          </h2>

          <label className="block text-sm mb-1">
            Activity
          </label>

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="e.g. Gym, study, work"
            className="w-full border rounded-xl p-3 mb-4"
          />

          <label className="block text-sm mb-1">
            Time
          </label>

          <input
            type="time"
            value={time}
            onChange={(event) =>
              setTime(event.target.value)
            }
            className="w-full border rounded-xl p-3 mb-4"
          />

          <div className="grid grid-cols-2 gap-3">

            <div>

              <label className="block text-sm mb-1">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full border rounded-xl p-3"
              >
                <option>Personal</option>
                <option>Work</option>
                <option>Study</option>
                <option>Health</option>
                <option>Finance</option>
                <option>Other</option>
              </select>

            </div>

            <div>

              <label className="block text-sm mb-1">
                Priority
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                className="w-full border rounded-xl p-3"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>

            </div>

          </div>

          <button
            type="submit"
            className="w-full mt-5 rounded-xl bg-black text-white py-3 font-semibold"
          >
            + Add activity
          </button>

        </form>

      </section>

      <p className="text-xs text-gray-500 mt-6">
        Keep the app open or installed as a PWA for in-app
        beep alerts. Browser notifications require permission.
      </p>

    </main>
  );
}
