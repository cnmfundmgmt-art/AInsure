"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "";

type Asset = {
  id: string;
  asset_type: string;
  name: string;
  value: number;
  created_at: string;
};
type Liability = {
  id: string;
  liability_type: string;
  name: string;
  amount: number;
  interest_rate: number | null;
  created_at: string;
};
type Snapshot = {
  id: string;
  monthly_income: number;
  monthly_expenses: number;
  emergency_fund: number | null;
  created_at: string;
};
type Profile = {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  monthly_surplus: number;
  emergency_fund_months: number;
  debt_to_income_ratio: number;
  latest_snapshot: Snapshot | null;
  assets: Asset[];
  liabilities: Liability[];
};

const ASSET_LABELS: Record<string, string> = {
  cash: "Cash & Savings",
  property: "Property",
  equity: "Stocks & Equity",
  fixed_income: "Fixed Income",
  crypto: "Cryptocurrency",
  retirement: "Retirement (EPF)",
  others: "Others",
};
const LIAB_LABELS: Record<string, string> = {
  mortgage: "Home Loan",
  car: "Car Loan",
  personal: "Personal Loan",
  credit_card: "Credit Card",
  education: "Education Loan",
  others: "Others",
};
const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(n);
}

function SnapshotForm() {
  const qc = useQueryClient();
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [emergency, setEmergency] = useState("");
  const { data: latest } = useQuery<Snapshot>({
    queryKey: ["snap"],
    queryFn: () =>
      fetch(API + "/api/financial/snapshot?latest=true").then((r) => r.json()),
  });
  const save = useMutation({
    mutationFn: (b: {
      monthly_income: number;
      monthly_expenses: number;
      emergency_fund?: number;
    }) =>
      fetch(API + "/api/financial/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["snap"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
  const surplus = parseFloat(income) || 0 - (parseFloat(expenses) || 0);
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-black">Income & Expenses</h2>
      {latest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Last:{" "}
          {new Date(latest.created_at).toLocaleDateString("en-MY") +
            " - " +
            fmt(Number(latest.monthly_income)) +
            " / " +
            fmt(Number(latest.monthly_expenses))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            monthly_income: parseFloat(income),
            monthly_expenses: parseFloat(expenses),
            ...(emergency
              ? { emergency_fund: parseFloat(emergency) }
              : {}),
          });
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">
            Monthly Income (MYR)
          </label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            min="0"
            step="100"
            required
            placeholder="e.g. 8000"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">
            Monthly Expenses (MYR)
          </label>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            min="0"
            step="100"
            required
            placeholder="e.g. 4500"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">
            Emergency Fund (MYR)
          </label>
          <input
            type="number"
            value={emergency}
            onChange={(e) => setEmergency(e.target.value)}
            min="0"
            step="100"
            placeholder="Optional"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          />
        </div>
        <div className="md:col-span-3 flex items-center gap-4">
          {surplus > 0 && (
            <span className="text-sm text-green-600">
              Surplus: {fmt(surplus)}
            </span>
          )}
          {surplus < 0 && (
            <span className="text-sm text-red-600">
              Deficit: {fmt(Math.abs(surplus))}
            </span>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium"
          >
            {save.isPending ? "Saving..." : "Save Snapshot"}
          </button>
        </div>
      </form>
      {save.isError && (
        <p className="text-red-600 text-sm">Failed to save.</p>
      )}
      {save.isSuccess && <p className="text-green-600 text-sm">Saved!</p>}
    </div>
  );
}

function AssetsTab() {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [atype, setAtype] = useState("cash");
  const [val, setVal] = useState("");
  const [delId, setDelId] = useState<string | null>(null);
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: () =>
      fetch(API + "/api/financial/assets").then((r) => r.json()),
  });
  const add = useMutation({
    mutationFn: (b: { asset_type: string; name: string; value: number }) =>
      fetch(API + "/api/financial/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setShow(false);
      setName("");
      setVal("");
    },
  });
  const del = useMutation({
    mutationFn: (id: string) =>
      fetch(API + "/api/financial/assets?id=" + id, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setDelId(null);
    },
  });
  const total = assets.reduce((s, a) => s + Number(a.value), 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">
          Assets{" "}
          <span className="text-sm font-normal text-gray-500 ml-2">
            Total: {fmt(total)}
          </span>
        </h2>
        <button
          onClick={() => setShow(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Asset
        </button>
      </div>
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : assets.length === 0 ? (
        <p className="text-gray-500 text-sm">No assets yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assets.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start"
            >
              <div>
                <div className="text-black font-medium text-sm">{a.name}</div>
                <div className="text-xs text-gray-500">
                  {ASSET_LABELS[a.asset_type] || a.asset_type}
                </div>
                <div className="text-green-600 font-mono text-sm mt-1">
                  {fmt(Number(a.value))}
                </div>
              </div>
              <button
                onClick={() => setDelId(a.id)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {delId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-black font-semibold mb-2">Delete Asset?</h3>
            <p className="text-gray-600 text-sm mb-4">Cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDelId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-black rounded-lg py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => del.mutate(delId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-black font-semibold mb-4">Add Asset</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Type
                </label>
                <select
                  value={atype}
                  onChange={(e) => setAtype(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  {Object.entries(ASSET_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Maybank Savings"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Value (MYR)
                </label>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  min="0"
                  required
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShow(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-black rounded-lg py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  add.mutate({ asset_type: atype, name, value: parseFloat(val) })
                }
                disabled={add.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm"
              >
                {add.isPending ? "Adding..." : "Add Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LiabilitiesTab() {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [ltype, setLtype] = useState("personal");
  const [amt, setAmt] = useState("");
  const [rate, setRate] = useState("");
  const [delId, setDelId] = useState<string | null>(null);
  const { data: liabs = [], isLoading } = useQuery<Liability[]>({
    queryKey: ["liabs"],
    queryFn: () =>
      fetch(API + "/api/financial/liabilities").then((r) => r.json()),
  });
  const add = useMutation({
    mutationFn: (b: {
      liability_type: string;
      name: string;
      amount: number;
      interest_rate?: number;
    }) =>
      fetch(API + "/api/financial/liabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liabs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setShow(false);
      setName("");
      setAmt("");
      setRate("");
    },
  });
  const del = useMutation({
    mutationFn: (id: string) =>
      fetch(API + "/api/financial/liabilities?id=" + id, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liabs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setDelId(null);
    },
  });
  const total = liabs.reduce((s, l) => s + Number(l.amount), 0);
  const estMo = (amount: number, rate: number | null) => {
    if (!rate) return amount;
    const r = rate / 100 / 12;
    const n = 240;
    return (
      Math.round(
        (amount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
      ) || 0
    );
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">
          Liabilities{" "}
          <span className="text-sm font-normal text-gray-500 ml-2">
            Total: {fmt(total)}
          </span>
        </h2>
        <button
          onClick={() => setShow(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Liability
        </button>
      </div>
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : liabs.length === 0 ? (
        <p className="text-gray-500 text-sm">No liabilities - great!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {liabs.map((l) => (
            <div
              key={l.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start"
            >
              <div>
                <div className="text-black font-medium text-sm">{l.name}</div>
                <div className="text-xs text-gray-500">
                  {LIAB_LABELS[l.liability_type] || l.liability_type}
                </div>
                <div className="text-red-600 font-mono text-sm mt-1">
                  {fmt(Number(l.amount))}
                </div>
                {l.interest_rate && (
                  <div className="text-xs text-gray-500">
                    {l.interest_rate}% p.a. - est. {fmt(estMo(Number(l.amount), l.interest_rate))}
                    /mo
                  </div>
                )}
              </div>
              <button
                onClick={() => setDelId(l.id)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {delId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-black font-semibold mb-2">
              Delete Liability?
            </h3>
            <p className="text-gray-600 text-sm mb-4">Cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDelId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-black rounded-lg py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => del.mutate(delId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-black font-semibold mb-4">Add Liability</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Type
                </label>
                <select
                  value={ltype}
                  onChange={(e) => setLtype(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  {Object.entries(LIAB_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Maybank Home Loan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Outstanding (MYR)
                </label>
                <input
                  type="number"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  min="0"
                  required
                  placeholder="e.g. 250000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShow(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-black rounded-lg py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  add.mutate({
                    liability_type: ltype,
                    name,
                    amount: parseFloat(amt),
                    ...(rate ? { interest_rate: parseFloat(rate) } : {}),
                  })
                }
                disabled={add.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm"
              >
                {add.isPending ? "Adding..." : "Add Liability"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTab() {
  const { data: p, isLoading } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: () =>
      fetch(API + "/api/financial/profile").then((r) => r.json()),
    refetchOnWindowFocus: false,
  });
  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!p)
    return (
      <p className="text-gray-500 text-sm">
        Add income, assets and liabilities to see your summary.
      </p>
    );
  const {
    total_assets,
    total_liabilities,
    net_worth,
    monthly_surplus,
    emergency_fund_months,
    debt_to_income_ratio,
    assets,
    liabilities,
  } = p;
  const byType = Object.entries(ASSET_LABELS)
    .map(([k, label]) => ({
      name: label,
      value: assets
        .filter((a) => a.asset_type === k)
        .reduce((s, a) => s + Number(a.value), 0),
    }))
    .filter((x) => x.value > 0);
  const lbType = Object.entries(LIAB_LABELS)
    .map(([k, label]) => ({
      name: label,
      value: liabilities
        .filter((l) => l.liability_type === k)
        .reduce((s, l) => s + Number(l.amount), 0),
    }))
    .filter((x) => x.value > 0);
  let hl = "Critical",
    hc = "text-red-600",
    hb = "bg-red-50 border border-red-200",
    hd = "Prioritise debt reduction.";
  if (
    net_worth > 0 &&
    debt_to_income_ratio < 0.5 &&
    monthly_surplus > 0
  ) {
    hl = "Healthy";
    hc = "text-green-600";
    hb = "bg-green-50 border border-green-200";
    hd = "Strong financial position.";
  } else if (net_worth > 0 || monthly_surplus > 0) {
    hl = "Building";
    hc = "text-yellow-600";
    hb = "bg-yellow-50 border border-yellow-200";
    hd = "Making progress.";
  }
  if (monthly_surplus < 0) hd = "Spending exceeds income.";
  else if (debt_to_income_ratio > 1) hd = "High debt ratio.";
  const total = total_assets + total_liabilities || 1;
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-black">Financial Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Net Worth</div>
          <div
            className={
              "text-lg font-mono font-bold " +
              (net_worth >= 0 ? "text-green-600" : "text-red-600")
            }
          >
            {fmt(net_worth)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">
            Monthly Surplus
          </div>
          <div
            className={
              "text-lg font-mono font-bold " +
              (monthly_surplus >= 0 ? "text-green-600" : "text-red-600")
            }
          >
            {fmt(monthly_surplus)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">
            Emergency Fund
          </div>
          <div className="text-lg font-mono font-bold text-indigo-600">
            {emergency_fund_months} mo
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">
            Debt-to-Income
          </div>
          <div
            className={
              "text-lg font-mono font-bold " +
              (debt_to_income_ratio > 1
                ? "text-red-600"
                : debt_to_income_ratio > 0.5
                ? "text-yellow-600"
                : "text-green-600")
            }
          >
            {debt_to_income_ratio}x
          </div>
        </div>
      </div>
      <div className={"border rounded-xl p-4 " + hb}>
        <div className="flex items-center gap-3">
          <span className={"text-2xl font-bold " + hc}>{hl}</span>
          <span className="text-gray-700 text-sm">{hd}</span>
        </div>
      </div>
      {byType.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-black mb-4">
              Asset Allocation
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    percent != null && percent > 0
                      ? name + " " + (percent * 100).toFixed(0) + "%"
                      : ""
                  }
                  labelLine={false}
                >
                  {byType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-black mb-4">
              Liabilities
            </h3>
            {lbType.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={lbType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => fmt(Number(v))}
                    stroke="#6b7280"
                    fontSize={10}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={10}
                    width={90}
                  />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Bar
                    dataKey="value"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-10">
                No liabilities - great!
              </p>
            )}
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Net Worth</span>
          <span
            className={
              "font-mono font-bold " +
              (net_worth >= 0 ? "text-green-600" : "text-red-600")
            }
          >
            {fmt(net_worth)}
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 h-full"
            style={{
              width: Math.min((total_assets / total) * 100, 100) + "%",
            }}
            title={"Assets: " + fmt(total_assets)}
          />
          <div
            className="bg-red-500 h-full"
            style={{
              width:
                Math.min((total_liabilities / total) * 100, 100) + "%",
            }}
            title={"Liabilities: " + fmt(total_liabilities)}
          />
        </div>
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-green-600">
            Assets{" "}
            {total_assets > 0
              ? Math.round((total_assets / total) * 100) + "%"
              : "0%"}
          </span>
          <span className="text-red-600">
            Liabilities{" "}
            {total_liabilities > 0
              ? Math.round((total_liabilities / total) * 100) + "%"
              : "0%"}
          </span>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "income", label: "Income & Expenses" },
  { id: "assets", label: "Assets" },
  { id: "liabilities", label: "Liabilities" },
  { id: "summary", label: "Summary" },
];

export default function FinancialsPage() {
  const [tab, setTab] = useState("income");
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Financial Tracker</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track your income, expenses, assets, and net worth
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "flex-1 min-w-fit px-4 py-2 rounded-md text-sm font-medium transition-colors " +
                (tab === t.id
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {tab === "income" && <SnapshotForm />}
          {tab === "assets" && <AssetsTab />}
          {tab === "liabilities" && <LiabilitiesTab />}
          {tab === "summary" && <SummaryTab />}
        </div>
      </div>
    </div>
  );
}
