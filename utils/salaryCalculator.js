/**
 * Salary calculation for payroll
 */

function parseDecimal(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function calculateAllowances(basicSalary, staffAllowances, allowanceTypes) {
  const typeMap = {};
  (allowanceTypes || []).forEach((t) => { typeMap[t.id] = t; });
  let total = 0;
  const breakdown = {};
  (staffAllowances || []).forEach((a) => {
    const type = typeMap[a.allowanceTypeId];
    if (!type) return;
    const val = parseDecimal(a.value);
    const amt = type.isPercent ? (basicSalary * val) / 100 : val;
    total += amt;
    breakdown[type.name || type.code] = amt;
  });
  return { total, breakdown };
}

function calculateDeductions(basicSalary, staffDeductions, deductionTypes) {
  const typeMap = {};
  (deductionTypes || []).forEach((t) => { typeMap[t.id] = t; });
  let total = 0;
  const breakdown = {};
  (staffDeductions || []).forEach((d) => {
    const type = typeMap[d.deductionTypeId];
    if (!type) return;
    const val = parseDecimal(d.value);
    const amt = type.isPercent ? (basicSalary * val) / 100 : val;
    total += amt;
    breakdown[type.name || type.code] = amt;
  });
  return { total, breakdown };
}

/**
 * Calculate net salary for a staff member
 */
function calculateSalary(opts) {
  const {
    basicSalary = 0,
    overtimeHours = 0,
    overtimeRate = 0,
    staffAllowances = [],
    allowanceTypes = [],
    staffDeductions = [],
    deductionTypes = [],
    bonusAmount = 0,
    leaveDeduction = 0,
  } = opts;

  const basic = parseDecimal(basicSalary);
  const { total: allowancesTotal, breakdown: allowancesBreakdown } = calculateAllowances(basic, staffAllowances, allowanceTypes);
  const { total: deductionsTotal, breakdown: deductionsBreakdown } = calculateDeductions(basic, staffDeductions, deductionTypes);
  const overtimePay = parseDecimal(overtimeHours * overtimeRate);
  const bonus = parseDecimal(bonusAmount);
  const leaveDed = parseDecimal(leaveDeduction);

  const grossSalary = basic + allowancesTotal + overtimePay + bonus;
  const totalDeductions = deductionsTotal + leaveDed;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    basicSalary: basic,
    allowancesTotal,
    allowancesBreakdown,
    deductionsTotal,
    deductionsBreakdown,
    overtimePay,
    bonusAmount: bonus,
    leaveDeduction: leaveDed,
    grossSalary,
    totalDeductions,
    netSalary,
  };
}

module.exports = { calculateSalary, calculateAllowances, calculateDeductions, parseDecimal };
