// Configurações
const MONTHLY_HOURS = 160;
const AVG_CONTRACT_COST = 6000;
const AVG_TIME_REDUCTION = 70;
const LABOR_CHARGES = 0.54; // 54% de encargos (13º, férias, FGTS, impostos)

let savingsChart = null;

document.getElementById('calculateBtn').addEventListener('click', calculateROI);
document.getElementById('recalculateBtn').addEventListener('click', reset);

function calculateROI() {
    const monthlySalary = parseFloat(document.getElementById('monthlySalary').value);
    const timeSpent = parseFloat(document.getElementById('timeSpent').value);
    
    if (!monthlySalary || monthlySalary <= 0) {
        alert('Informe o salário mensal');
        return;
    }
    
    if (!timeSpent || timeSpent <= 0) {
        alert('Informe as horas gastas');
        return;
    }
    
    document.getElementById('loadingOverlay').classList.add('active');
    
    setTimeout(() => {
        processCalc(monthlySalary, timeSpent);
        document.getElementById('loadingOverlay').classList.remove('active');
    }, 1000);
}

function processCalc(baseSalary, timeSpent) {
    // Calcular custo total com encargos
    const totalMonthlyCost = baseSalary * (1 + LABOR_CHARGES);
    const hourlyCost = totalMonthlyCost / MONTHLY_HOURS;
    
    // Cálculos de economia
    const currentTaskCost = timeSpent * hourlyCost;
    const timeReduction = timeSpent * (AVG_TIME_REDUCTION / 100);
    const newTimeSpent = timeSpent - timeReduction;
    const newTaskCost = newTimeSpent * hourlyCost;
    const monthlySavings = currentTaskCost - newTaskCost;
    
    const contractCost = AVG_CONTRACT_COST;
    const yearSavings = monthlySavings * 12;
    const roi = ((yearSavings - contractCost) / contractCost) * 100;
    const paybackMonths = contractCost / monthlySavings;
    
    // Atualizar resumo formal
    document.getElementById('totalCostSummary').textContent = fmt(totalMonthlyCost);
    document.getElementById('paybackSummary').textContent = `${paybackMonths.toFixed(1)} meses`;
    document.getElementById('roiSummary').textContent = `${roi.toFixed(0)}%`;
    document.getElementById('investmentSummary').textContent = fmt(contractCost);
    
    // Atualizar métricas
    document.getElementById('roiValue').textContent = `${roi.toFixed(0)}%`;
    document.getElementById('paybackPeriod').textContent = `${paybackMonths.toFixed(1)} meses`;
    document.getElementById('yearSavings').textContent = fmt(yearSavings);
    
    // Gráfico
    generateChart(monthlySavings, contractCost, paybackMonths);
    
    // Mostrar resultados
    document.getElementById('resultsSection').style.display = 'block';
    setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function generateChart(monthlySavings, contractCost, paybackMonths) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    if (savingsChart) savingsChart.destroy();
    
    const labels = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6', 
                    'Mês 7', 'Mês 8', 'Mês 9', 'Mês 10', 'Mês 11', 'Mês 12'];
    const data = [];
    
    for (let i = 1; i <= 12; i++) {
        data.push((monthlySavings * i) - contractCost);
    }
    
    savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Retorno Acumulado',
                data: data,
                borderColor: '#f7dc3a',
                backgroundColor: 'transparent',
                borderWidth: 3,
                fill: false,
                tension: 0.1,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#f7dc3a',
                pointBorderColor: '#f7dc3a',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#252930',
                    titleColor: '#f7dc3a',
                    bodyColor: '#ffffff',
                    borderColor: '#f7dc3a',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (context) => 'Retorno: ' + fmt(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#a0aec0',
                        font: {
                            size: 12
                        },
                        callback: (val) => {
                            if (val === 0) return 'R$ 0';
                            return val > 0 
                                ? 'R$ ' + (val/1000).toFixed(0) + 'k'
                                : '-R$ ' + (Math.abs(val)/1000).toFixed(0) + 'k';
                        }
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: '#a0aec0',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        },
        plugins: [{
            id: 'breakEvenLine',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                // Linha de zero (break-even horizontal)
                const yZero = yAxis.getPixelForValue(0);
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(xAxis.left, yZero);
                ctx.lineTo(xAxis.right, yZero);
                ctx.stroke();
                ctx.restore();
            }
        }]
    });
}

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function reset() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('monthlySalary').value = '';
    document.getElementById('timeSpent').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateROI();
    });
});