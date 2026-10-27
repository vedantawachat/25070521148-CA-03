
import { useEffect, useMemo, useState } from "react";
import "./index.css";

const starterTasks = [
  { id: 1, title: "Review today's lecture notes", category: "Study", priority: "High", due: "Today", completed: false },
  { id: 2, title: "Complete React practice", category: "Project", priority: "Medium", due: "Today", completed: false },
  { id: 3, title: "Plan tomorrow's schedule", category: "Personal", priority: "Low", due: "Today", completed: true },
];

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem("todoUser") || "");
  const [loginName, setLoginName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("todoTasks") || "null") || starterTasks;
    } catch {
      return starterTasks;
    }
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Study");
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("Today");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("Tasks");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
  }, [tasks]);

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const progress = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesView =
        view === "History" ? task.completed :
        view === "Tasks" ? !task.completed : true;

      const matchesFilter =
        filter === "All" || task.priority === filter;

      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesView && matchesFilter && matchesSearch;
    });
  }, [tasks, view, filter, search]);

  function handleLogin(e) {
    e.preventDefault();
    const displayName = isRegister
      ? loginName.trim()
      : email.split("@")[0];

    if (!email.trim() || !password) return;
    if (isRegister && !displayName) return;

    // Demo login only. Real authentication will use the Node.js API.
    localStorage.setItem("todoUser", displayName);
    setUser(displayName);
  }

  function logout() {
    localStorage.removeItem("todoUser");
    setUser("");
    setPassword("");
  }

  function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setTasks((old) => [
      {
        id: Date.now(),
        title: title.trim(),
        category,
        priority,
        due,
        completed: false,
      },
      ...old,
    ]);

    setTitle("");
    setCategory("Study");
    setPriority("Medium");
    setDue("Today");
    setShowForm(false);
    setView("Tasks");
  }

  function toggleTask(id) {
    setTasks((old) =>
      old.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((old) => old.filter((task) => task.id !== id));
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  if (!user) {
    return (
      <main className="todo-auth">
        <section className="todo-auth-card">
          <div className="todo-logo">✓</div>
          <p className="todo-kicker">YOUR PERSONAL WORKSPACE</p>
          <h1>{isRegister ? "Create your account." : "Make today count."}</h1>
          <p className="todo-muted">
            {isRegister
              ? "Start organizing your day, one task at a time."
              : "Sign in and turn your plans into progress."}
          </p>

          <div className="todo-auth-tabs">
            <button
              className={!isRegister ? "selected" : ""}
              onClick={() => setIsRegister(false)}
              type="button"
            >
              Login
            </button>
            <button
              className={isRegister ? "selected" : ""}
              onClick={() => setIsRegister(true)}
              type="button"
            >
              Register
            </button>
          </div>

          <form onSubmit={handleLogin} className="todo-form">
            {isRegister && (
              <label>
                Your name
                <input
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 8 : undefined}
                required
              />
            </label>

            <button className="todo-primary" type="submit">
              {isRegister ? "Create account →" : "Enter dashboard →"}
            </button>
          </form>

          <p className="todo-demo-note">
            Demo mode: authentication will be connected to MongoDB next.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="todo-app">
      <aside className="todo-sidebar">
        <div className="todo-brand">
          <span className="todo-logo small">✓</span>
          <span>Taskflow<span className="todo-purple">.</span></span>
        </div>

        <p className="todo-nav-label">WORKSPACE</p>
        <button
          className={`todo-nav-item ${view === "Tasks" ? "current" : ""}`}
          onClick={() => setView("Tasks")}
        >
          <span>▦</span> My tasks
          <span className="todo-count">{activeTasks.length}</span>
        </button>
        <button
          className={`todo-nav-item ${view === "History" ? "current" : ""}`}
          onClick={() => setView("History")}
        >
          <span>◷</span> Previous tasks
        </button>
        <button
          className={`todo-nav-item ${view === "All" ? "current" : ""}`}
          onClick={() => setView("All")}
        >
          <span>☷</span> All tasks
        </button>

        <div className="todo-sidebar-bottom">
          <div className="todo-user">
            <div className="todo-avatar">
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="todo-user-info">
              <strong>{user}</strong>
              <span>Personal workspace</span>
            </div>
          </div>
          <button className="todo-logout" onClick={logout}>↪ Log out</button>
        </div>
      </aside>

      <section className="todo-main">
        <header className="todo-topbar">
          <span>Workspace / <strong>{view}</strong></span>
          <span className="todo-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </header>

        <div className="todo-content">
          <div className="todo-heading-row">
            <div>
              <p className="todo-kicker">{greeting().toUpperCase()}</p>
              <h1>{view === "History" ? "Your achievements." : "Your dashboard."}</h1>
              <p className="todo-muted">
                {view === "History"
                  ? "Look back at everything you've completed."
                  : "Small steps every day lead to big results."}
              </p>
            </div>
            <button
              className="todo-primary add-button"
              onClick={() => setShowForm(!showForm)}
            >
              + Add task
            </button>
          </div>

          <div className="todo-stats">
            <article className="todo-stat-card">
              <div className="stat-icon violet">▦</div>
              <span>Total tasks</span>
              <strong>{tasks.length}</strong>
              <small>Across your workspace</small>
            </article>
            <article className="todo-stat-card">
              <div className="stat-icon orange">◷</div>
              <span>In progress</span>
              <strong>{activeTasks.length}</strong>
              <small>Still on your list</small>
            </article>
            <article className="todo-stat-card">
              <div className="stat-icon green">✓</div>
              <span>Completed</span>
              <strong>{completedTasks.length}</strong>
              <small>Tasks you've finished</small>
            </article>
            <article className="todo-stat-card progress-card">
              <div className="stat-progress">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="31" className="progress-track" />
                  <circle
                    cx="40" cy="40" r="31"
                    className="progress-value"
                    strokeDasharray={`${progress * 1.948} 194.8`}
                  />
                </svg>
                <strong>{progress}%</strong>
              </div>
              <span>Overall progress</span>
              <small>Keep going!</small>
            </article>
          </div>

          {showForm && (
            <form className="todo-create-card" onSubmit={addTask}>
              <div className="todo-create-heading">
                <div>
                  <h2>Create a new task</h2>
                  <p className="todo-muted">Add a little progress to your day.</p>
                </div>
                <button type="button" className="todo-close" onClick={() => setShowForm(false)}>×</button>
              </div>

              <label className="todo-full-field">
                Task name
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish assignment"
                  required
                />
              </label>

              <div className="todo-fields-grid">
                <label>
                  Category
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Study</option>
                    <option>Work</option>
                    <option>Project</option>
                    <option>Personal</option>
                  </select>
                </label>
                <label>
                  Priority
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>
                <label>
                  Due date
                  <select value={due} onChange={(e) => setDue(e.target.value)}>
                    <option>Today</option>
                    <option>Tomorrow</option>
                    <option>This week</option>
                    <option>No deadline</option>
                  </select>
                </label>
              </div>
              <button className="todo-primary" type="submit">Save task →</button>
            </form>
          )}

          <section className="todo-list-card">
            <div className="todo-list-heading">
              <div>
                <h2>
                  {view === "History" ? "Completed tasks" :
                    view === "All" ? "All your tasks" : "Your task list"}
                </h2>
                <p className="todo-muted">
                  {visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"} shown
                </p>
              </div>
              <div className="todo-filters">
                <input
                  className="todo-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="⌕ Search tasks..."
                  aria-label="Search tasks"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter by priority"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="todo-empty">
                <div>✓</div>
                <h3>No tasks here yet</h3>
                <p>Try changing your filters or add a new task.</p>
                <button className="todo-primary" onClick={() => setShowForm(true)}>
                  + Create a task
                </button>
              </div>
            ) : (
              <div className="todo-task-list">
                {visibleTasks.map((task) => (
                  <article className={`todo-task ${task.completed ? "is-complete" : ""}`} key={task.id}>
                    <button
                      className={`todo-check ${task.completed ? "checked" : ""}`}
                      onClick={() => toggleTask(task.id)}
                      aria-label={task.completed ? "Mark as incomplete" : "Complete task"}
                    >
                      {task.completed ? "✓" : ""}
                    </button>
                    <div className="todo-task-info">
                      <strong>{task.title}</strong>
                      <div className="todo-task-meta">
                        <span>{task.category}</span>
                        <span>·</span>
                        <span>{task.due}</span>
                      </div>
                    </div>
                    <span className={`todo-priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <button
                      className="todo-delete"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="todo-bottom-note">
            <span>✦</span> Progress over perfection. You've got this.
          </footer>
        </div>
      </section>
    </main>
  );
}
