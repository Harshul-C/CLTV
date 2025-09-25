import React, { useState, useEffect } from 'react';
import { Calculator, Download, Info, DollarSign, TrendingUp } from 'lucide-react';

interface CLVData {
  margin: number;
  repeatProbabilities: number[];
  acquisitionCost: number;
  discountRate: number;
  timeHorizon: number;
}

function App() {
  const [data, setData] = useState<CLVData>({
    margin: 60,
    repeatProbabilities: [100, 90, 85, 85, 60, 30],
    acquisitionCost: 6,
    discountRate: 10,
    timeHorizon: 6
  });

  const [clv, setCLV] = useState<number>(0);
  const [yearlyBreakdown, setYearlyBreakdown] = useState<Array<{
    year: number;
    margin: number;
    repeatProb: number;
    adjustedMargin: number;
    discountFactor: number;
    presentValue: number;
    calculation: string;
  }>>([]);
  const [totalPV, setTotalPV] = useState<number>(0);

  useEffect(() => {
    calculateCLV();
  }, [data]);

  const calculateCLV = () => {
    let totalPresentValue = 0;
    const breakdown = [];

    for (let t = 0; t < data.timeHorizon; t++) {
      const repeatProb = data.repeatProbabilities[t] || 0;
      const adjustedMargin = data.margin * (repeatProb / 100);
      const discountFactor = Math.pow(1 + data.discountRate / 100, t);
      const presentValue = adjustedMargin / discountFactor;
      
      totalPresentValue += presentValue;

      // Create calculation string for display
      let calculation = '';
      if (t === 0) {
        calculation = `$${data.margin} × ${repeatProb/100} = $${adjustedMargin.toFixed(0)}`;
      } else {
        calculation = `$${adjustedMargin.toFixed(0)} ÷ (1+${data.discountRate/100})^${t} ≈ $${presentValue.toFixed(0)}`;
      }

      breakdown.push({
        year: t,
        margin: data.margin,
        repeatProb,
        adjustedMargin,
        discountFactor,
        presentValue,
        calculation
      });
    }

    const finalCLV = totalPresentValue - data.acquisitionCost;
    setCLV(finalCLV);
    setTotalPV(totalPresentValue);
    setYearlyBreakdown(breakdown);
  };

  const updateRepeatProbability = (index: number, value: number) => {
    const newProbs = [...data.repeatProbabilities];
    newProbs[index] = value;
    setData({ ...data, repeatProbabilities: newProbs });
  };

  const addYear = () => {
    if (data.timeHorizon < 10) {
      setData({
        ...data,
        timeHorizon: data.timeHorizon + 1,
        repeatProbabilities: [...data.repeatProbabilities, 20]
      });
    }
  };

  const removeYear = () => {
    if (data.timeHorizon > 1) {
      setData({
        ...data,
        timeHorizon: data.timeHorizon - 1,
        repeatProbabilities: data.repeatProbabilities.slice(0, -1)
      });
    }
  };

  const exportResults = () => {
    const csvContent = [
      ['Year', 'Margin ($)', 'Repeat Prob (%)', 'Adjusted Margin ($)', 'Discount Factor', 'Present Value ($)', 'Calculation'],
      ...yearlyBreakdown.map(row => [
        row.year === 0 ? 'Acquisition' : `Year ${row.year}`,
        row.margin.toFixed(2),
        row.repeatProb.toFixed(0),
        row.adjustedMargin.toFixed(2),
        row.discountFactor.toFixed(4),
        row.presentValue.toFixed(2),
        row.calculation
      ]),
      ['', '', '', '', '', 'Total PV:', totalPV.toFixed(2)],
      ['', '', '', '', '', 'Acquisition Cost:', (-data.acquisitionCost).toFixed(2)],
      ['', '', '', '', '', 'Final CLV:', clv.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clv_discounting_calculation.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Discounting Future Cash Flows
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate individual CLV using discounted cash flow analysis with step-by-step discounting calculations
          </p>
        </div>

        {/* Formula Display */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-600 mt-1" />
            <h2 className="text-xl font-semibold text-gray-900">CLV Formula</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 font-mono text-center">
            <div className="text-lg text-gray-800 mb-2">
              Individual CLV = 
              <span className="mx-2 text-2xl">∑</span>
              <span className="text-sm align-top">T</span>
              <span className="text-sm align-bottom ml-1">t=0</span>
            </div>
            <div className="text-xl text-gray-800 border-t border-gray-300 pt-2 inline-block px-4">
              <div>(p<sub>t</sub> - c<sub>t</sub>) r<sub>t</sub></div>
              <div className="border-t border-gray-400 mt-1 pt-1">
                (1 + i)<sup>t</sup>
              </div>
            </div>
            <span className="text-lg mx-4">- AC</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
            <div><strong>p<sub>t</sub> - c<sub>t</sub>:</strong> Margin per period</div>
            <div><strong>r<sub>t</sub>:</strong> Repeat purchase probability</div>
            <div><strong>i:</strong> Discount rate</div>
            <div><strong>AC:</strong> Acquisition cost</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                Input Parameters
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Parameters */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margin (p - c) $
                  </label>
                  <input
                    type="number"
                    value={data.margin}
                    onChange={(e) => setData({ ...data, margin: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acquisition Cost $
                  </label>
                  <input
                    type="number"
                    value={data.acquisitionCost}
                    onChange={(e) => setData({ ...data, acquisitionCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.discountRate}
                  onChange={(e) => setData({ ...data, discountRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="10"
                />
              </div>

              {/* Time Horizon Controls */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Time Horizon: {data.timeHorizon} periods
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={removeYear}
                      disabled={data.timeHorizon <= 1}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={addYear}
                      disabled={data.timeHorizon >= 10}
                      className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Repeat Purchase Probabilities */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Repeat Purchase Probabilities (%)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: data.timeHorizon }).map((_, index) => (
                      <div key={index}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {index === 0 ? 'Acquisition' : `Year ${index}`}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={data.repeatProbabilities[index] || 0}
                          onChange={(e) => updateRepeatProbability(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Discounting Calculations</h2>
                <button
                  onClick={exportResults}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Detailed Breakdown Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="text-left py-3 px-3 font-medium border border-blue-500">Period</th>
                      <th className="text-center py-3 px-3 font-medium border border-blue-500">Margin × r</th>
                      <th className="text-center py-3 px-3 font-medium border border-blue-500">Applying Discounting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyBreakdown.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium border border-gray-200">
                          {row.year === 0 ? 'Year 0 - Acquisition' : `Year ${row.year}`}
                        </td>
                        <td className="py-3 px-3 text-center border border-gray-200">
                          ${data.margin} × {(row.repeatProb/100).toFixed(1)} = ${row.adjustedMargin.toFixed(0)}
                        </td>
                        <td className="py-3 px-3 text-center border border-gray-200">
                          {row.year === 0 ? (
                            `$${row.adjustedMargin.toFixed(0)}`
                          ) : (
                            `$${row.adjustedMargin.toFixed(0)} ÷ (1+${(data.discountRate/100).toFixed(1)})^${row.year} ≈ $${row.presentValue.toFixed(0)}`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Calculation */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <div className="text-center space-y-3">
                  <div className="text-lg font-mono">
                    <span className="text-2xl">∑</span>
                    <span className="text-sm align-top">T</span>
                    <span className="text-sm align-bottom ml-1">t=0</span>
                    <span className="mx-2">
                      <span className="border-t border-gray-400 inline-block px-2 pt-1">
                        (p<sub>t</sub> - c<sub>t</sub>) r<sub>t</sub>
                      </span>
                      <br />
                      <span className="inline-block px-2">
                        (1 + i)<sup>t</sup>
                      </span>
                    </span>
                    <span className="text-blue-600 font-bold text-xl">= ${totalPV.toFixed(0)}</span>
                    <span className="mx-4">AC = ${data.acquisitionCost}</span>
                  </div>
                </div>
              </div>

              {/* Final CLV Result */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-lg text-gray-700 mb-2">
                    Individual CLV for a {data.timeHorizon - 1}-year horizon post acquisition
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    ${totalPV.toFixed(0)} - ${data.acquisitionCost} = ${clv.toFixed(0)}
                  </div>
                  <div className={`text-lg font-medium ${clv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {clv >= 0 ? 'Profitable Customer' : 'Unprofitable Customer'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;