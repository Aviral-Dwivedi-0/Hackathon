import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import 'chart.js/auto';
import './styles.css';
import logoImg from './assets/Logo_zen.png';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Chart color schemes with vibrant, distinct colors
const chartColors = {
  model1: {
    primary: 'rgba(255, 99, 132, 1)', // Pink
    secondary: 'rgba(255, 99, 132, 0.5)',
    gradient: 'rgba(255, 99, 132, 0.2)'
  },
  model2: {
    primary: 'rgba(53, 162, 235, 1)', // Blue
    secondary: 'rgba(53, 162, 235, 0.5)',
    gradient: 'rgba(53, 162, 235, 0.2)'
  },
  single: {
    primary: 'rgba(75, 192, 192, 1)', // Teal
    secondary: 'rgba(75, 192, 192, 0.5)',
    gradient: 'rgba(75, 192, 192, 0.2)'
  }
};

// Chart options for bar charts
const getChartOptions = (isDarkMode = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: isDarkMode ? '#fff' : '#333',
        font: {
          size: 12
        }
      }
    },
    x: {
      grid: {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: isDarkMode ? '#fff' : '#333',
        font: {
          size: 12
        }
      }
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: isDarkMode ? '#fff' : '#333',
        font: {
          size: 14
        }
      }
    }
  }
});

function App() {
  const [mode, setMode] = useState('single');
  const [stage, setStage] = useState('upload');
  const [theme, setTheme] = useState('light');
  const [showAbout, setShowAbout] = useState(false);
  const [showZen, setShowZen] = useState(false);
  const [uploadProgress1, setUploadProgress1] = useState(0);
  const [uploadProgress2, setUploadProgress2] = useState(0);
  const [benchmarkResults, setBenchmarkResults] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading1, setIsUploading1] = useState(false);
  const [isUploading2, setIsUploading2] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const uploadController = useRef(null);
  const lastProgress1 = useRef(0);
  const lastProgress2 = useRef(0);

  // Cleanup chart instance when component unmounts
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      if (uploadController.current) {
        uploadController.current.abort();
      }
      lastProgress1.current = 0;
      lastProgress2.current = 0;
    };
  }, []);

  const createOrUpdateChart = (chartData) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new ChartJS(ctx, {
      type: 'radar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              font: {
                size: 12
              }
            },
            grid: {
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            angleLines: {
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            pointLabels: {
              font: {
                size: 14
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.r;
                return `${datasetLabel}: ${value.toFixed(1)}% difference`;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14
              },
              color: theme === 'dark' ? '#fff' : '#000'
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        elements: {
          line: {
            tension: 0.4
          }
        }
      }
    });
  };

  // Update chart when benchmark results change
  useEffect(() => {
    if (benchmarkResults.length >= 2) {
      const radarData = getComparisonRadarData();
      if (radarData) {
        createOrUpdateChart(radarData);
      }
    }
  }, [benchmarkResults]);

  const onDrop1 = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || isUploading1) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadProgress1(0);
    lastProgress1.current = 0;
    setIsUploading1(true);
    setError(null);

    if (uploadController.current) {
      uploadController.current.abort();
    }
    uploadController.current = new AbortController();

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        signal: uploadController.current.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted > lastProgress1.current) {
            setUploadProgress1(percentCompleted);
            lastProgress1.current = percentCompleted;
          }
        }
      });

      setBenchmarkResults(prev => {
        const newResults = mode === 'single' ? [response.data] : 
          prev.length === 2 ? [response.data, prev[1]] : [response.data];
        return newResults;
      });
      
      if (mode === 'single' || (mode === 'compare' && benchmarkResults.length === 1)) {
        setStage('benchmark');
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Upload cancelled');
      } else {
        console.error('Error:', err);
        setError('Error uploading file 1');
      }
    } finally {
      setIsUploading1(false);
      lastProgress1.current = 0;
    }
  };

  const onDrop2 = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || isUploading2) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadProgress2(0);
    lastProgress2.current = 0;
    setIsUploading2(true);
    setError(null);

    const controller = new AbortController();

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted > lastProgress2.current) {
            setUploadProgress2(percentCompleted);
            lastProgress2.current = percentCompleted;
          }
        }
      });

      setBenchmarkResults(prev => {
        if (prev.length === 0) return [response.data];
        if (prev.length === 2) return [prev[0], response.data];
        return [...prev, response.data];
      });

      if (benchmarkResults.length === 1) {
        setStage('benchmark');
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Upload cancelled');
      } else {
        console.error('Error:', err);
        setError('Error uploading file 2');
      }
    } finally {
      setIsUploading2(false);
      lastProgress2.current = 0;
    }
  };

  const getComparisonChartData = () => {
    const labels = ['File Size (MB)', 'Memory Usage (MB)', 'Inference Time (ms)'];
    return {
      labels,
      datasets: [
        {
          label: benchmarkResults[0].model_name,
          data: [
            benchmarkResults[0].file_size,
            benchmarkResults[0].memory_usage,
            benchmarkResults[0].inference_time * 1000
          ],
          backgroundColor: chartColors.model1.secondary,
          borderColor: chartColors.model1.primary,
          borderWidth: 1
        },
        {
          label: benchmarkResults[1].model_name,
          data: [
            benchmarkResults[1].file_size,
            benchmarkResults[1].memory_usage,
            benchmarkResults[1].inference_time * 1000
          ],
          backgroundColor: chartColors.model2.secondary,
          borderColor: chartColors.model2.primary,
          borderWidth: 1
        }
      ]
    };
  };

  const getComparisonRadarData = () => {
    if (!benchmarkResults || benchmarkResults.length < 2) return null;

    // Helper function to get relative difference between two values
    const getRelativeDifference = (val1, val2) => {
      const max = Math.max(val1, val2);
      const min = Math.min(val1, val2);
      return max === 0 ? 0 : ((max - min) / max) * 100;
    };

    // Calculate relative differences for each metric
    const metrics = [
      {
        name: 'File Size',
        value: getRelativeDifference(benchmarkResults[0].file_size, benchmarkResults[1].file_size),
        better: benchmarkResults[0].file_size < benchmarkResults[1].file_size
      },
      {
        name: 'Memory Usage',
        value: getRelativeDifference(benchmarkResults[0].memory_usage, benchmarkResults[1].memory_usage),
        better: benchmarkResults[0].memory_usage < benchmarkResults[1].memory_usage
      },
      {
        name: 'Inference Speed',
        value: getRelativeDifference(1/benchmarkResults[0].inference_time, 1/benchmarkResults[1].inference_time),
        better: benchmarkResults[0].inference_time < benchmarkResults[1].inference_time
      },
      {
        name: 'Output Complexity',
        value: getRelativeDifference(
          benchmarkResults[0].output_shape.reduce((a, b) => a * b, 1),
          benchmarkResults[1].output_shape.reduce((a, b) => a * b, 1)
        ),
        better: benchmarkResults[0].output_shape.reduce((a, b) => a * b, 1) < 
                benchmarkResults[1].output_shape.reduce((a, b) => a * b, 1)
      }
    ];

    return {
      labels: metrics.map(m => m.name),
      datasets: [
        {
          label: benchmarkResults[0].model_name,
          data: metrics.map(m => m.better ? m.value : 0),
          backgroundColor: chartColors.model1.gradient,
          borderColor: chartColors.model1.primary,
          borderWidth: 2,
          pointBackgroundColor: chartColors.model1.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: chartColors.model1.primary,
          fill: true
        },
        {
          label: benchmarkResults[1].model_name,
          data: metrics.map(m => !m.better ? m.value : 0),
          backgroundColor: chartColors.model2.gradient,
          borderColor: chartColors.model2.primary,
          borderWidth: 2,
          pointBackgroundColor: chartColors.model2.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: chartColors.model2.primary,
          fill: true
        }
      ]
    };
  };

  const getSingleModelChartData = (result) => {
    const barData = {
      labels: ['File Size (MB)', 'Memory Usage (MB)', 'Inference Time (ms)'],
      datasets: [
        {
          label: result.model_name,
          data: [
            result.file_size,
            result.memory_usage,
            result.inference_time * 1000
          ],
          backgroundColor: chartColors.single.secondary,
          borderColor: chartColors.single.primary,
          borderWidth: 1
        }
      ]
    };

    const radarData = {
      labels: ['File Size', 'Memory Usage', 'Inference Speed', 'Output Size'],
      datasets: [
        {
          label: result.model_name,
          data: [
            result.file_size,
            result.memory_usage,
            1/result.inference_time,
            result.output_shape.reduce((a, b) => a * b, 1)
          ],
          backgroundColor: chartColors.single.gradient,
          borderColor: chartColors.single.primary,
          borderWidth: 2,
          pointBackgroundColor: chartColors.single.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: chartColors.single.primary
        }
      ]
    };

    return { barData, radarData };
  };

  const getPerformanceAnalysisData = () => {
    if (benchmarkResults.length !== 2) return null;

    const model1 = benchmarkResults[0];
    const model2 = benchmarkResults[1];

    // Calculate percentage differences
    const fileSizeDiff = ((model2.file_size - model1.file_size) / model1.file_size) * 100;
    const memoryDiff = ((model2.memory_usage - model1.memory_usage) / model1.memory_usage) * 100;
    const timeDiff = ((model2.inference_time - model1.inference_time) / model1.inference_time) * 100;

    return {
      labels: ['File Size', 'Memory Usage', 'Inference Time'],
      datasets: [
        {
          label: 'Percentage Difference',
          data: [fileSizeDiff, memoryDiff, timeDiff],
          backgroundColor: [
            fileSizeDiff > 0 ? 'rgba(255, 99, 132, 0.5)' : 'rgba(75, 192, 192, 0.5)',
            memoryDiff > 0 ? 'rgba(255, 99, 132, 0.5)' : 'rgba(75, 192, 192, 0.5)',
            timeDiff > 0 ? 'rgba(255, 99, 132, 0.5)' : 'rgba(75, 192, 192, 0.5)'
          ],
          borderColor: [
            fileSizeDiff > 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)',
            memoryDiff > 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)',
            timeDiff > 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getPerformanceOptions = (isDarkMode = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Percentage Difference (%)',
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666',
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const betterOrWorse = value > 0 ? 'higher' : 'lower';
            return `Model 2 is ${Math.abs(value).toFixed(1)}% ${betterOrWorse}`;
          }
        }
      }
    }
  });

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const { getRootProps: getRootProps1, getInputProps: getInputProps1, isDragActive: isDragActive1 } = useDropzone({
    onDrop: onDrop1,
    accept: { 'application/octet-stream': ['.pt', '.h5', '.onnx'] },
    maxFiles: 1,
    disabled: isUploading1
  });

  const { getRootProps: getRootProps2, getInputProps: getInputProps2, isDragActive: isDragActive2 } = useDropzone({
    onDrop: onDrop2,
    accept: { 'application/octet-stream': ['.pt', '.h5', '.onnx'] },
    maxFiles: 1,
    disabled: isUploading2
  });

  const generatePDF = async () => {
    // Temporarily switch to light mode for PDF generation
    const currentTheme = theme;
    setTheme('light');

    // Wait for charts to re-render with light theme
    await new Promise(resolve => setTimeout(resolve, 100));

    const pdf = new jsPDF();
    
    // Add logo and title
    const logoWidth = 40;
    const logoHeight = 40;
    pdf.addImage(logoImg, 'PNG', 20, 10, logoWidth, logoHeight);
    
    pdf.setFontSize(22);
    pdf.text('Model Benchmark Report', 70, 35);
    
    let yPos = 60;
    
    // Add timestamp
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 20;

    const addModelDetails = (result, startY) => {
      pdf.setFontSize(16);
      pdf.text(`Model: ${result.model_name}`, 20, startY);
      
      const tableData = [
        ['Metric', 'Value'],
        ['File Size', `${result.file_size.toFixed(2)} MB`],
        ['Memory Usage', `${result.memory_usage.toFixed(2)} MB`],
        ['Inference Time', `${(result.inference_time * 1000).toFixed(2)} ms`],
        ['Output Shape', `[${result.output_shape.join(', ')}]`],
      ];
      
      pdf.autoTable({
        startY: startY + 10,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 20 },
        tableWidth: 170
      });
      
      return pdf.lastAutoTable.finalY + 10;
    };

    try {
      // Add model details
      if (mode === 'single') {
        yPos = addModelDetails(benchmarkResults[0], yPos);

        // Add a new page for charts
        pdf.addPage();
        pdf.setFontSize(16);

        // Capture and add performance metrics chart
        const metricsChart = document.querySelector('.chart-card canvas');
        if (metricsChart) {
          pdf.text('Performance Metrics', 20, 20);
          const chartImage = metricsChart.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = (metricsChart.height * imgWidth) / metricsChart.width;
          pdf.addImage(chartImage, 'PNG', 20, 30, imgWidth, imgHeight);

          // Add legend explaining the metrics
          pdf.setFontSize(10);
          pdf.setTextColor(102, 102, 102);
          const legendY = 40 + imgHeight;
          pdf.text('* File Size: Total size of the model in MB', 20, legendY);
          pdf.text('* Memory Usage: Runtime memory consumption in MB', 20, legendY + 10);
          pdf.text('* Inference Time: Average time per prediction in milliseconds', 20, legendY + 20);
        }
      } else {
        // First model
        yPos = addModelDetails(benchmarkResults[0], yPos);
        
        // Comparison section
        pdf.setFontSize(16);
        pdf.text('Model Comparison', 20, yPos);
        yPos += 10;
        
        // Second model
        yPos = addModelDetails(benchmarkResults[1], yPos);

        // Add charts if in compare mode
        // Add a new page for charts
        pdf.addPage();
        pdf.setFontSize(16);
        
        // Capture and add metric comparison chart
        const comparisonChart = document.querySelector('.chart-card:first-child canvas');
        if (comparisonChart) {
          pdf.text('Metric Comparison', 20, 20);
          const comparisonImage = comparisonChart.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = (comparisonChart.height * imgWidth) / comparisonChart.width;
          pdf.addImage(comparisonImage, 'PNG', 20, 30, imgWidth, imgHeight);
        }

        // Capture and add performance analysis chart
        const analysisChart = document.querySelector('.chart-card:last-child canvas');
        if (analysisChart) {
          const prevChartHeight = comparisonChart ? 
            (comparisonChart.height * 170) / comparisonChart.width + 40 : 0;
          
          pdf.text('Performance Analysis', 20, prevChartHeight + 30);
          const analysisImage = analysisChart.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = (analysisChart.height * imgWidth) / analysisChart.width;
          pdf.addImage(analysisImage, 'PNG', 20, prevChartHeight + 40, imgWidth, imgHeight);

          // Add legend
          pdf.setFontSize(10);
          const legendY = prevChartHeight + 40 + imgHeight + 10;
          pdf.setTextColor(102, 102, 102);
          pdf.text('* Negative values indicate Model 2 performs better (uses less resources)', 20, legendY);
          pdf.text('* Positive values indicate Model 1 performs better', 20, legendY + 10);
        }
      }

      pdf.save('benchmark-report.pdf');
    } finally {
      // Restore original theme after PDF generation
      setTheme(currentTheme);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="navbar">
        <div className="nav-left">
          <img 
            src={logoImg} 
            alt="IntelliZen Logo" 
            className="nav-logo" 
            onClick={() => setShowZen(true)}
          />
        </div>
        <div className="nav-center">
          <h1 className="app-title" onClick={() => window.location.reload()}>IntelliZen</h1>
        </div>
        <div className="nav-right">
          <div className="nav-links">
            <button onClick={() => setShowAbout(true)} className="nav-link">About</button>
          </div>
          <div className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </div>
        </div>
      </nav>

      {/* About Popup */}
      {showAbout && (
        <div className="popup-overlay" onClick={() => setShowAbout(false)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <h2 className="about-title">About IntelliZen</h2>
            <p className="zen-motto">Built with simplicity, powered by intelligence — that's the Zen way</p>
            <div className="about-content">
              <p>Hey there! 👋</p>
              <p>We're Team Zen, a bunch of curious minds who teamed up during Hackathon 2025 to build something cool — and that's how IntelliZen was created.</p>
              <p>IntelliZen is a powerful AI model benchmarking tool that helps you analyze and compare machine learning models with ease. Whether you're optimizing performance, exploring tradeoffs, or selecting the best model for your use case — IntelliZen is here to help.</p>
              <p>We've built this using React and FastAPI, with support for PyTorch, TensorFlow, and ONNX models. Everything runs smoothly in Docker containers, making it easy to deploy anywhere.</p>
            </div>
          </div>
        </div>
      )}

      {/* Zen Popup */}
      {showZen && (
        <div className="popup-overlay" onClick={() => setShowZen(false)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <h2 className="zen-title">Meet Our Team</h2>
            <p className="zen-motto">The minds behind IntelliZen</p>
            <div className="zen-content">
              <div className="team-members">
                <div className="team-member">
                  <h3>Khushi Agarwal</h3>
                  <p>Frontend Developer</p>
                  <p className="team-member-desc">Crafting beautiful, intuitive user experiences</p>
                </div>
                <div className="team-member">
                  <h3>Aviral Dwivedi</h3>
                  <p>Backend Developer</p>
                  <p className="team-member-desc">Building robust server-side solutions</p>
                </div>
                <div className="team-member">
                  <h3>Siddhant Jaiswal</h3>
                  <p>Backend Developer</p>
                  <p className="team-member-desc">Optimizing model inference and analysis</p>
                </div>
                <div className="team-member">
                  <h3>Priyanka</h3>
                  <p>Frontend Developer</p>
                  <p className="team-member-desc">Creating responsive, modern interfaces</p>
                </div>
                <div className="team-member">
                  <h3>Kartikey Karnwal</h3>
                  <p>UI/UX Designer</p>
                  <p className="team-member-desc">Designing delightful user experiences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="upload-container">
        {stage === 'upload' && (
          <div className="mode-selection">
            <h2 className="text-xl font-bold mb-4">Select Benchmark Mode</h2>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="single"
                  checked={mode === 'single'}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setBenchmarkResults([]);
                  }}
                  className="mr-2"
                />
                Single Model Analysis
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="compare"
                  checked={mode === 'compare'}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setBenchmarkResults([]);
                  }}
                  className="mr-2"
                />
                Compare Two Models
              </label>
            </div>
          </div>
        )}

        <div className="dropzone-container">
          <div className="space-y-4">
            <div
              {...getRootProps1()}
              className={`dropzone ${isDragActive1 ? 'active' : ''}`}
            >
              <input {...getInputProps1()} />
              <div className="upload-icon">📤</div>
              <p className="text-lg">
                {benchmarkResults[0]
                  ? `Uploaded: ${benchmarkResults[0].model_name}`
                  : `Drag & drop ${mode === 'compare' ? 'first ' : ''}model here`}
              </p>
              <p className="text-sm text-gray-500">Supported: .pt, .h5, .onnx</p>
              {uploadProgress1 > 0 && (
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${uploadProgress1}%` }}
                  />
                  <span className="progress-text">{uploadProgress1}%</span>
                </div>
              )}
              {isUploading1 && <p className="text-sm text-gray-500">Uploading...</p>}
            </div>

            {benchmarkResults[0] && (
              <div className="model-card">
                <h3>Model {mode === 'compare' ? '1' : ''} Details</h3>
                <div className="model-details">
                  <div><span className="font-medium">Type:</span> {benchmarkResults[0].model_type}</div>
                  <div><span className="font-medium">Size:</span> {benchmarkResults[0].file_size.toFixed(2)} MB</div>
                  <div><span className="font-medium">Memory:</span> {benchmarkResults[0].memory_usage.toFixed(2)} MB</div>
                </div>
              </div>
            )}
          </div>

          {mode === 'compare' && (
            <div className="space-y-4">
              <div
                {...getRootProps2()}
                className={`dropzone ${isDragActive2 ? 'active' : ''}`}
              >
                <input {...getInputProps2()} />
                <div className="upload-icon">📤</div>
                <p className="text-lg">
                  {benchmarkResults[1]
                    ? `Uploaded: ${benchmarkResults[1].model_name}`
                    : 'Drag & drop second model here'}
                </p>
                <p className="text-sm text-gray-500">Supported: .pt, .h5, .onnx</p>
                {uploadProgress2 > 0 && (
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${uploadProgress2}%` }}
                    />
                    <span className="progress-text">{uploadProgress2}%</span>
                  </div>
                )}
                {isUploading2 && <p className="text-sm text-gray-500">Uploading...</p>}
              </div>

              {benchmarkResults[1] && (
                <div className="model-card">
                  <h3>Model 2 Details</h3>
                  <div className="model-details">
                    <div><span className="font-medium">Type:</span> {benchmarkResults[1].model_type}</div>
                    <div><span className="font-medium">Size:</span> {benchmarkResults[1].file_size.toFixed(2)} MB</div>
                    <div><span className="font-medium">Memory:</span> {benchmarkResults[1].memory_usage.toFixed(2)} MB</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mt-4">
            {error}
          </div>
        )}

        <button
          onClick={() => setStage('benchmark')}
          disabled={mode === 'single' ? !benchmarkResults[0] : benchmarkResults.length !== 2}
          className="compare-button"
        >
          {mode === 'single' ? 'Start Benchmark' : 'Compare Models'}
        </button>
      </div>

      {stage === 'benchmark' && benchmarkResults.length > 0 && (
        <div className="results-container">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Benchmark Results</h2>
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Generate PDF Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {benchmarkResults.map((result, index) => (
              <div key={index} className="result-card">
                <h3 className="text-xl font-bold mb-4">
                  Model {index + 1}: {result.model_name}
                </h3>
                <div className="grid gap-3">
                  <div className="metric-item">
                    <strong>Type:</strong> {result.model_type}
                  </div>
                  <div className="metric-item">
                    <strong>File Size:</strong> {result.file_size.toFixed(2)} MB
                  </div>
                  <div className="metric-item">
                    <strong>Memory Usage:</strong> {result.memory_usage.toFixed(2)} MB
                  </div>
                  <div className="metric-item">
                    <strong>Inference Time:</strong> {(result.inference_time * 1000).toFixed(2)} ms
                  </div>
                  <div className="metric-item">
                    <strong>Output Shape:</strong> [{result.output_shape.join(', ')}]
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="charts-container">
            {mode === 'single' && benchmarkResults.length === 1 && (
              <>
                <div className="chart-card">
                  <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
                  <div className="chart-container">
                    <Bar 
                      data={getSingleModelChartData(benchmarkResults[0]).barData}
                      options={getChartOptions(theme === 'dark')}
                    />
                  </div>
                </div>
                <div className="chart-card">
                  <h3 className="text-xl font-bold mb-4">Performance Analysis</h3>
                  <div className="chart-container">
                    <Bar 
                      data={getSingleModelChartData(benchmarkResults[0]).radarData}
                      options={getChartOptions(theme === 'dark')}
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'compare' && benchmarkResults.length === 2 && (
              <>
                <div className="chart-card">
                  <h3 className="text-xl font-bold mb-4">Metric Comparison</h3>
                  <div className="chart-container" style={{ height: '400px' }}>
                    <Bar data={getComparisonChartData()} options={getChartOptions(theme === 'dark')} />
                  </div>
                </div>
                <div className="chart-card mt-8">
                  <h3 className="text-xl font-bold mb-4">Performance Analysis</h3>
                  <div className="chart-container" style={{ height: '400px' }}>
                    <Bar data={getPerformanceAnalysisData()} options={getPerformanceOptions()} />
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>* Negative values indicate Model 2 performs better (uses less resources)</p>
                    <p>* Positive values indicate Model 1 performs better</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
