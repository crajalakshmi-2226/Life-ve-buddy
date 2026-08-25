import React, { useState } from 'react';
import { Cpu, Award, Zap, BarChart3, HelpCircle, Layers, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ML_MODEL_BENCHMARKS } from '../../utils/aiRiskEngine';
import { MLModelType } from '../../types';

export const MLModelComparison: React.FC = () => {
  const [selectedModelName, setSelectedModelName] = useState<MLModelType>('Random Forest');

  const selectedModel = ML_MODEL_BENCHMARKS.find(m => m.modelName === selectedModelName) || ML_MODEL_BENCHMARKS[0];
  const cm = selectedModel.confusionMatrix;
  const totalSamples = cm.truePositive + cm.falsePositive + cm.trueNegative + cm.falseNegative;

  // Feature Importance data
  const featureImportances = [
    { feature: "Attendance Rate (< 75% Cutoff)", importance: 34, description: "Direct compliance indicator for university debarment criteria" },
    { feature: "Pending Coursework Backlog", importance: 24, description: "Correlates with midterm and practical exam failure" },
    { feature: "Historical Missed Deadlines", importance: 18, description: "Predicts chronic time management and late submission risk" },
    { feature: "Recent Academic Marks Trend", importance: 14, description: "Evaluates gradient of internal marks and quiz performance" },
    { feature: "Deadline / Exam Proximity", importance: 6, description: "Time urgency scaling factor" },
    { feature: "Student Portal Engagement Index", importance: 4, description: "LMS material downloads and active review frequency" }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-purple-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl border border-purple-200">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                Data Science Suite
              </span>
              <span className="text-xs text-purple-600 font-medium">Model Evaluation & Benchmark</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950 mt-0.5">
              Machine Learning Risk Classifier Benchmarks
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The alert system evaluates historical student trajectories against 4 distinct supervised machine learning architectures to predict academic probation, exam debarment, and administrative non-compliance.
        </p>

        {/* Model Performance Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-purple-100 rounded-2xl overflow-hidden">
            <thead className="bg-purple-50/80 text-purple-950 font-bold border-b border-purple-100">
              <tr>
                <th className="p-3.5">Algorithm</th>
                <th className="p-3.5">Accuracy</th>
                <th className="p-3.5">Precision</th>
                <th className="p-3.5">Recall</th>
                <th className="p-3.5">F1-Score</th>
                <th className="p-3.5">Inference Latency</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 text-slate-700">
              {ML_MODEL_BENCHMARKS.map((m) => {
                const isSelected = m.modelName === selectedModelName;

                return (
                  <tr 
                    key={m.modelName}
                    onClick={() => setSelectedModelName(m.modelName)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-purple-100/60 font-bold text-purple-950' : 'hover:bg-purple-50/40'
                    }`}
                  >
                    <td className="p-3.5 font-bold flex items-center gap-2">
                      <span>{m.modelName}</span>
                      {m.modelName === 'XGBoost' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900 text-[10px]">
                          Highest Score
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-700">{m.accuracy}%</td>
                    <td className="p-3.5">{m.precision}%</td>
                    <td className="p-3.5">{m.recall}%</td>
                    <td className="p-3.5 font-bold text-purple-900">{m.f1Score}%</td>
                    <td className="p-3.5 font-mono text-slate-500">{m.latencyMs} ms</td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isSelected ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        {isSelected ? 'Active View' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep-Dive Grid: Confusion Matrix (Left) & Feature Importance (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Confusion Matrix */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div>
              <h3 className="text-sm font-bold font-classic text-purple-950">
                Confusion Matrix ({selectedModel.modelName})
              </h3>
              <p className="text-[11px] text-slate-500">Evaluation on test cohort (N={totalSamples} student cases)</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 text-xs font-bold">
              Acc: {selectedModel.accuracy}%
            </span>
          </div>

          {/* 2x2 Matrix Visualizer */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* True Positive */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-1">
              <div className="flex justify-between font-bold text-emerald-950">
                <span>True Positive (TP)</span>
                <span className="text-base font-extrabold text-emerald-700">{cm.truePositive}</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Correctly flagged at-risk students who needed timely intervention.
              </p>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex justify-between font-bold text-rose-950">
                <span>False Positive (FP)</span>
                <span className="text-base font-extrabold text-rose-700">{cm.falsePositive}</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-tight">
                Safe students cautiously warned (Type I error).
              </p>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-1">
              <div className="flex justify-between font-bold text-amber-950">
                <span>False Negative (FN)</span>
                <span className="text-base font-extrabold text-amber-700">{cm.falseNegative}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Missed risk instances (Type II error, minimized by high Recall).
              </p>
            </div>

            {/* True Negative */}
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-300 space-y-1">
              <div className="flex justify-between font-bold text-purple-950">
                <span>True Negative (TN)</span>
                <span className="text-base font-extrabold text-purple-700">{cm.trueNegative}</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-tight">
                Correctly confirmed safe and compliant students.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-purple-950">{selectedModel.modelName} Architecture Notes:</div>
            <p className="text-[11px] leading-relaxed text-slate-600">{selectedModel.description}</p>
            <p className="text-[11px] text-purple-800 font-semibold pt-1">💡 {selectedModel.keyStrengths}</p>
          </div>
        </div>

        {/* Right Column: Feature Importance Ranking */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <h3 className="text-sm font-bold font-classic text-purple-950 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-700" />
              <span>Model Feature Importances (Gini Index)</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Normalized Weights</span>
          </div>

          <div className="space-y-3">
            {featureImportances.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{item.feature}</span>
                  <span className="font-bold text-purple-900">{item.importance}%</span>
                </div>
                <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.importance * 2.8}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
