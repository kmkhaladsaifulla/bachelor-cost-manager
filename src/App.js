import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  doc, getDoc, setDoc
} from "firebase/firestore";

const MANAGER_PASSWORD = "iamtheboss";
const DATA_DOC = doc(db, "sharedCostManager", "mainData");

function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function blankMeals(residents) {
  const m = {};
  for (let d = 1; d <= 31; d++) {
    m[d] = {};
    residents.forEach((name) => {
      m[d][name] = { Breakfast: 0, Lunch: 0, Dinner: 0 };
    });
  }
  return m;
}

function App() {
  const [isManager, setIsManager] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(10);
  const actualMonthDays = getMonthDays(year, month);

  const [data, setData] = useState({
    residents: [],
    contributions: [],
    groceries: [],
    meals: blankMeals([]),
  });
  const [nameInput, setNameInput] = useState("");
  const [contributor, setContributor] = useState("");
  const [amount, setAmount] = useState("");
  const [contributionDate, setContributionDate] = useState("");
  const [groceryAmount, setGroceryAmount] = useState("");
  const [groceryDesc, setGroceryDesc] = useState("");
  const [groceryDate, setGroceryDate] = useState("");

  useEffect(() => {
    getDoc(DATA_DOC).then((docSnap) => {
      if (docSnap.exists()) setData(docSnap.data());
    });
  }, []);

  async function saveData(newData) {
    await setDoc(DATA_DOC, newData);
    setData(newData);
  }

  function addResident() {
    if (!nameInput.trim() || data.residents.includes(nameInput.trim())) return;
    const newResidents = [...data.residents, nameInput.trim()];
    const newMeals = blankMeals(newResidents);
    saveData({ ...data, residents: newResidents, meals: newMeals });
    setNameInput("");
  }
  function removeResident(idx) {
    const newResidents = data.residents.filter((_, i) => i !== idx);
    const newMeals = blankMeals(newResidents);
    saveData({ ...data, residents: newResidents, meals: newMeals });
  }

  function addContribution() {
    if (!contributor.trim() || !amount || !contributionDate) return;
    const newContributions = [
      ...data.contributions,
      { contributor: contributor.trim(), amount: parseFloat(amount), date: contributionDate },
    ];
    saveData({ ...data, contributions: newContributions });
    setContributor(""); setAmount(""); setContributionDate("");
  }
  function removeContribution(idx) {
    const newContributions = data.contributions.filter((_, i) => i !== idx);
    saveData({ ...data, contributions: newContributions });
  }

  function addGrocery() {
    if (!groceryDesc.trim() || !groceryAmount || !groceryDate) return;
    const newGroceries = [
      ...data.groceries,
      { desc: groceryDesc.trim(), amount: parseFloat(groceryAmount), date: groceryDate }
    ];
    saveData({ ...data, groceries: newGroceries });
    setGroceryDesc(""); setGroceryAmount(""); setGroceryDate("");
  }
  function removeGrocery(idx) {
    const newGroceries = data.groceries.filter((_, i) => i !== idx);
    saveData({ ...data, groceries: newGroceries });
  }

  function handleMealChange(name, day, mealType, value) {
    const mealsCopy = JSON.parse(JSON.stringify(data.meals));
    if (!mealsCopy[day]) mealsCopy[day] = {};
    if (!mealsCopy[day][name]) mealsCopy[day][name] = { Breakfast: 0, Lunch: 0, Dinner: 0 };
    mealsCopy[day][name][mealType] = Number(value) || 0;
    saveData({ ...data, meals: mealsCopy });
  }
  function getMealInput(name, day, mealType) {
    return data.meals?.[day]?.[name]?.[mealType] ?? 0;
  }

  const totalGroceries = data.groceries.reduce((a, b) => a + b.amount, 0);
  const totalContributed = data.contributions.reduce((a, b) => a + b.amount, 0);

  const mealCounts = data.residents.map(name => ({
    name,
    meals: Array.from({ length: actualMonthDays }).reduce((total, _, i) => {
      const day = i + 1;
      return total +
        (data.meals[day]?.[name]?.Breakfast || 0) +
        (data.meals[day]?.[name]?.Lunch || 0) +
        (data.meals[day]?.[name]?.Dinner || 0);
    }, 0)
  }));
  const totalMeals = mealCounts.reduce((sum, m) => sum + m.meals, 0);
  const costPerMeal = totalMeals ? totalGroceries / totalMeals : 0;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1500, margin: "auto", padding: 24, background: "#fefefe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ marginBottom: 4 }}>Bachelor Cost Manager</h2>
        <span style={{ fontWeight: "bold", color: isManager ? "#27ac27" : "#888" }}>
          {isManager ? "Manager Mode" : "View Only"}
        </span>
      </div>
      {!isManager && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Manager password"
            value={passwordAttempt}
            onChange={e => setPasswordAttempt(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <button onClick={() => {
            if (passwordAttempt === MANAGER_PASSWORD) {
              setIsManager(true); setPasswordAttempt("");
            } else {
              alert("Wrong password.");
            }
          }}>Enter Manager Mode</button>
        </div>
      )}
      {isManager && (
        <button onClick={() => setIsManager(false)}
          style={{ marginBottom: 18, background: "#ffe6e6", border: "1px solid #eee", padding: "5px 10px", borderRadius: 6 }}
        >
          Switch to View Only
        </button>
      )}
      {/* Residents */}
      <div style={{ background: "#e6ffe6", padding: 18, borderRadius: 8, marginBottom: 16 }}>
        <h3>Residents for the Month</h3>
        {isManager &&
          <div style={{ marginBottom: 12 }}>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Resident name"
              style={{ marginRight: 8 }}
            />
            <button onClick={addResident}>Add Resident</button>
          </div>}
        <div>
          {data.residents.map((name, i) => (
            <span key={name} style={{
              display: "inline-block",
              background: "#fff",
              padding: "4px 10px",
              marginRight: 8,
              borderRadius: 6,
              boxShadow: "0 0 2px #ccc"
            }}>
              {name}
              {isManager &&
                <button onClick={() => removeResident(i)} style={{ color: "#e22", marginLeft: 6, border: "none", background: "transparent", cursor: "pointer" }}>×</button>
              }
            </span>
          ))}
        </div>
      </div>

      {/* Contributions */}
      <div style={{ background: "#ffe6e6", padding: 18, borderRadius: 8, marginBottom: 16 }}>
        <h3>Add Money Contribution</h3>
        {isManager &&
          <div style={{ marginBottom: 6 }}>
            <select value={contributor} onChange={e => setContributor(e.target.value)}>
              <option value="">Select resident</option>
              {data.residents.map(name => (
                <option value={name} key={name}>{name}</option>
              ))}
            </select>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              style={{ width: 80, marginLeft: 6 }}
            />
            <input
              value={contributionDate}
              onChange={e => setContributionDate(e.target.value)}
              type="date"
              style={{ marginLeft: 6 }}
            />
            <button onClick={addContribution} style={{ marginLeft: 6 }}>Add</button>
          </div>
        }
        <div>
          <strong>Total Contributed: </strong> {totalContributed}
          <div style={{ marginTop: 4 }}>
            {data.contributions.map((c, i) =>
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {c.contributor} - {c.amount} ({c.date})
                {isManager &&
                  <button onClick={() => removeContribution(i)}
                    style={{ marginLeft: 8, color: "#e22", border: "none", background: "transparent", cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>
                    ×
                  </button>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Groceries */}
      <div style={{ background: "#e6f0ff", padding: 18, borderRadius: 8, marginBottom: 16 }}>
        <h3>Add Grocery Expense</h3>
        {isManager &&
          <div style={{ marginBottom: 6 }}>
            <input
              value={groceryDesc}
              onChange={e => setGroceryDesc(e.target.value)}
              placeholder="Description"
              style={{ width: 120 }}
            />
            <input
              value={groceryAmount}
              onChange={e => setGroceryAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              style={{ width: 80, marginLeft: 6 }}
            />
            <input
              value={groceryDate}
              onChange={e => setGroceryDate(e.target.value)}
              type="date"
              style={{ marginLeft: 6 }}
            />
            <button onClick={addGrocery} style={{ marginLeft: 6 }}>Add</button>
          </div>
        }
        <div>
          <strong>Total Groceries: </strong> {totalGroceries}
          <div style={{ marginTop: 4 }}>
            {data.groceries.map((g, i) =>
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {g.desc}: {g.amount} ({g.date})
                {isManager &&
                  <button onClick={() => removeGrocery(i)}
                    style={{ marginLeft: 8, color: "#e22", border: "none", background: "transparent", cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>
                    ×
                  </button>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meals Table with Breakfast */}
      <div style={{ background: "#fffbe6", padding: 18, borderRadius: 8, marginBottom: 16 }}>
        <h3>Meals Table (includes Breakfast)</h3>
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table style={{ borderCollapse: "collapse", minWidth: data.residents.length * 220 + 120 }}>
            <thead>
              <tr style={{ background: "#f0e8d4" }}>
                <th>Date</th>
                {data.residents.map(name => [
                  <th key={name + "-B"}>{name} Breakfast</th>,
                  <th key={name + "-L"}>{name} Lunch</th>,
                  <th key={name + "-D"}>{name} Dinner</th>
                ])}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 31 }).map((_, dayIdx) => {
                const day = dayIdx + 1;
                return (
                  <tr key={day}>
                    <td style={{ border: "1px solid #ddd", padding: "2px 6px", fontWeight: "bold" }}>{day}</td>
                    {data.residents.map(name => [
                      <td key={name+"-B-"+day} style={{ border: '1px solid #ddd', padding: '2px 6px' }}>
                        {isManager ?
                          <input type="number" min="0" max="10"
                            value={getMealInput(name, day, "Breakfast")}
                            onChange={e => handleMealChange(name, day, "Breakfast", e.target.value)}
                            style={{ width: 40 }} />
                          : <span>{getMealInput(name, day, "Breakfast")}</span>
                        }
                      </td>,
                      <td key={name+"-L-"+day} style={{ border: '1px solid #ddd', padding: '2px 6px' }}>
                        {isManager ?
                          <input type="number" min="0" max="10"
                            value={getMealInput(name, day, "Lunch")}
                            onChange={e => handleMealChange(name, day, "Lunch", e.target.value)}
                            style={{ width: 40 }} />
                          : <span>{getMealInput(name, day, "Lunch")}</span>
                        }
                      </td>,
                      <td key={name+"-D-"+day} style={{ border: '1px solid #ddd', padding: '2px 6px' }}>
                        {isManager ?
                          <input type="number" min="0" max="10"
                            value={getMealInput(name, day, "Dinner")}
                            onChange={e => handleMealChange(name, day, "Dinner", e.target.value)}
                            style={{ width: 40 }} />
                          : <span>{getMealInput(name, day, "Dinner")}</span>
                        }
                      </td>
                    ])}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ margin: "12px 0" }}>
          <em>(Now tracks Breakfast, Lunch, and Dinner for every person, every day.)</em>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div style={{ background: "#f0f0f0", padding: 18, borderRadius: 8 }}>
        <h3>Monthly Summary</h3>
        <div>
          <strong>Cost per Meal: </strong>{costPerMeal.toFixed(2)}
        </div>
        <div>
          <strong>Total Meals: </strong>{totalMeals}
        </div>
        <table style={{ marginTop: 10, width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Meals</th>
              <th>Share (Cost)</th>
              <th>Contribution</th>
              <th>Balance (Payable/Receivable)</th>
            </tr>
          </thead>
          <tbody>
            {mealCounts.map(({ name, meals }) => {
              const contribTotal = data.contributions
                .filter(c => c.contributor === name)
                .reduce((sum, c) => sum + c.amount, 0);
              const share = meals * costPerMeal;
              const balance = contribTotal - share;
              return (
                <tr key={name}>
                  <td style={{ border: "1px solid #ddd", padding: "2px 6px" }}>{name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "2px 6px" }}>{meals}</td>
                  <td style={{ border: "1px solid #ddd", padding: "2px 6px" }}>{share.toFixed(2)}</td>
                  <td style={{ border: "1px solid #ddd", padding: "2px 6px" }}>{contribTotal.toFixed(2)}</td>
                  <td style={{
                    border: "1px solid #ddd",
                    padding: "2px 6px",
                    background: balance < 0 ? "#ffeaea" : "#eaffea",
                    color: balance < 0 ? "#c00" : "#009900"
                  }}>
                    {balance >= 0
                      ? `Receivable ${balance.toFixed(2)}`
                      : `Payable ${(-balance).toFixed(2)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 14 }}>
          <strong>Remaining Balance (Contributed - Groceries): </strong>
          {(totalContributed - totalGroceries).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

export default App;
