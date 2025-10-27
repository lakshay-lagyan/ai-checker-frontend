// Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://ai-text-detector-api-e0yl.onrender.com';

console.log('API URL:', API_URL);

// DOM Elements
const textInput = document.getElementById('textInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeBtnText = document.getElementById('analyzeBtnText');
const analyzeBtnSpinner = document.getElementById('analyzeBtnSpinner');
const detailedAnalysis = document.getElementById('detailedAnalysis');
const showExplanation = document.getElementById('showExplanation');

// File upload elements
const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.getElementById('fileUploadArea');
const selectedFile = document.getElementById('selectedFile');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const analyzeFileBtn = document.getElementById('analyzeFileBtn');
const analyzeFileBtnText = document.getElementById('analyzeFileBtnText');
const analyzeFileBtnSpinner = document.getElementById('analyzeFileBtnSpinner');
const detailedAnalysisFile = document.getElementById('detailedAnalysisFile');
const showExplanationFile = document.getElementById('showExplanationFile');

// Tab elements
const textTab = document.getElementById('textTab');
const fileTab = document.getElementById('fileTab');
const textInputSection = document.getElementById('textInputSection');
const fileInputSection = document.getElementById('fileInputSection');

// Results elements
const successMessage = document.getElementById('successMessage');
const resultsSection = document.getElementById('resultsSection');
const verdictBadge = document.getElementById('verdictBadge');
const verdictIcon = document.getElementById('verdictIcon');
const verdictText = document.getElementById('verdictText');
const probabilityBar = document.getElementById('probabilityBar');
const barFill = document.getElementById('barFill');
const humanProb = document.getElementById('humanProb');
const aiProb = document.getElementById('aiProb');
const confidence = document.getElementById('confidence');
const wordCount = document.getElementById('wordCount');
const detailedSection = document.getElementById('detailedSection');
const analysisDetails = document.getElementById('analysisDetails');
const explanationSection = document.getElementById('explanationSection');
const explanationContent = document.getElementById('explanationContent');

// State
let currentFile = null;

// Tab Switching
textTab.addEventListener('click', () => {
    textTab.classList.add('active');
    fileTab.classList.remove('active');
    textInputSection.style.display = 'block';
    fileInputSection.style.display = 'none';
    hideResults();
});

fileTab.addEventListener('click', () => {
    fileTab.classList.add('active');
    textTab.classList.remove('active');
    fileInputSection.style.display = 'block';
    textInputSection.style.display = 'none';
    hideResults();
});

// Text Input Handler
textInput.addEventListener('input', () => {
    const text = textInput.value.trim();
    analyzeBtn.disabled = text.length < 50;
});

// File Upload Handlers
fileUploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

removeFileBtn.addEventListener('click', () => {
    currentFile = null;
    selectedFile.style.display = 'none';
    fileInput.value = '';
    analyzeFileBtn.disabled = true;
});

function handleFileSelect(file) {
    const validTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
        alert('Invalid file type. Please upload TXT, PDF, DOC, or DOCX files.');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB.');
        return;
    }
    
    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    selectedFile.style.display = 'flex';
    analyzeFileBtn.disabled = false;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Analyze Button Handler
analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    
    if (text.length < 50) {
        alert('Text must be at least 50 characters long.');
        return;
    }
    
    await analyzeText(text, detailedAnalysis.checked, showExplanation.checked);
});

// Analyze File Button Handler
analyzeFileBtn.addEventListener('click', async () => {
    if (!currentFile) {
        alert('Please select a file first.');
        return;
    }
    
    await analyzeFile(currentFile, detailedAnalysisFile.checked, showExplanationFile.checked);
});

// API Call - Analyze Text
async function analyzeText(text, showDetailed, showExplain) {
    setLoading(true, 'text');
    hideResults();
    
    try {
        const formData = new FormData();
        formData.append('text', text);
        
        const response = await fetch(`${API_URL}/detect/text`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage();
            displayResults(data, text, showDetailed, showExplain);
        } else {
            alert(data.detail || 'Analysis failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please check if the backend is running.');
    } finally {
        setLoading(false, 'text');
    }
}

// API Call - Analyze File
async function analyzeFile(file, showDetailed, showExplain) {
    setLoading(true, 'file');
    hideResults();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_URL}/detect/file`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage();
            displayResults(data, null, showDetailed, showExplain);
        } else {
            alert(data.detail || 'File analysis failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please check if the backend is running.');
    } finally {
        setLoading(false, 'file');
    }
}

// Display Results
function displayResults(data, inputText, showDetailed, showExplain) {
    // Calculate word count
    let words;
    if (inputText) {
        words = inputText.trim().split(/\s+/).filter(w => w.length > 0);
    } else {
        // Estimate from file
        words = [];
    }
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Update verdict
    const isAI = data.verdict === 'AI-Generated';
    verdictIcon.textContent = isAI ? 'AI' : '✓';
    verdictIcon.className = isAI ? 'verdict-icon' : 'verdict-icon human';
    verdictText.textContent = data.verdict;
    
    // Update probability bar
    const aiProbability = data.ai_probability * 100;
    barFill.style.width = `${100 - aiProbability}%`;
    
    // Update stats
    humanProb.textContent = `${(data.human_probability * 100).toFixed(1)}%`;
    aiProb.textContent = `${aiProbability.toFixed(1)}%`;
    confidence.textContent = `${data.confidence_score.toFixed(1)}%`;
    wordCount.textContent = words.length > 0 ? words.length : 'N/A';
    
    // Show detailed analysis if checked
    if (showDetailed && data.analysis_details) {
        displayDetailedAnalysis(data.analysis_details);
    }
    
    // Show explanation if checked
    if (showExplain) {
        displayExplanation(data);
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display Detailed Analysis
function displayDetailedAnalysis(details) {
    detailedSection.style.display = 'block';
    analysisDetails.innerHTML = '';
    
    const metrics = [
        { key: 'Lexical Diversity', value: details.lexical_diversity },
        { key: 'AI Phrase Density', value: details.ai_phrase_density },
        { key: 'Sentence Variance', value: details.sentence_length_variance },
        { key: 'Pacing Consistency', value: details.pacing_consistency },
        { key: 'Formality Score', value: details.formality_score },
        { key: 'Mixed Register', value: details.mixed_register_score }
    ];
    
    metrics.forEach(metric => {
        const item = document.createElement('div');
        item.className = 'analysis-item';
        item.innerHTML = `
            <span class="analysis-key">${metric.key}:</span>
            <span class="analysis-value">${typeof metric.value === 'number' ? metric.value.toFixed(3) : metric.value}</span>
        `;
        analysisDetails.appendChild(item);
    });
}

// Display Explanation
function displayExplanation(data) {
    explanationSection.style.display = 'block';
    
    const isAI = data.verdict === 'AI-Generated';
    const aiProb = (data.ai_probability * 100).toFixed(1);
    const humanProb = (data.human_probability * 100).toFixed(1);
    
    let explanation = `<p><strong>Analysis Result:</strong> The text has been classified as <strong>${data.verdict}</strong> with ${data.confidence_score.toFixed(1)}% confidence.</p>`;
    
    explanation += `<p><strong>Probability Breakdown:</strong></p><ul>`;
    explanation += `<li>AI-Generated: ${aiProb}%</li>`;
    explanation += `<li>Human-Written: ${humanProb}%</li>`;
    explanation += `</ul>`;
    
    if (data.traits_detected && data.traits_detected.length > 0) {
        explanation += `<p><strong>Key Indicators:</strong></p><ul>`;
        data.traits_detected.forEach(trait => {
            explanation += `<li>${trait}</li>`;
        });
        explanation += `</ul>`;
    }
    
    explanation += `<p><strong>Detection Methods:</strong> ${data.detection_methods.length} advanced algorithms were used including ensemble ML models, TF-IDF analysis, and cognitive pattern recognition.</p>`;
    
    if (isAI) {
        explanation += `<p>The text exhibits patterns commonly associated with AI-generated content, such as uniform sentence structure, high use of transition phrases, and consistent pacing.</p>`;
    } else {
        explanation += `<p>The text shows characteristics of human writing, including natural variation in sentence length, conversational markers, and authentic voice.</p>`;
    }
    
    explanationContent.innerHTML = explanation;
}

// Show Success Message
function showSuccessMessage() {
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Hide Results
function hideResults() {
    resultsSection.style.display = 'none';
    detailedSection.style.display = 'none';
    explanationSection.style.display = 'none';
}

// Set Loading State
function setLoading(isLoading, source) {
    if (source === 'text') {
        analyzeBtn.disabled = isLoading;
        analyzeBtnText.style.display = isLoading ? 'none' : 'inline';
        analyzeBtnSpinner.style.display = isLoading ? 'inline-block' : 'none';
        
        if (isLoading) {
            analyzeBtn.classList.add('loading');
        } else {
            analyzeBtn.classList.remove('loading');
        }
    } else if (source === 'file') {
        analyzeFileBtn.disabled = isLoading;
        analyzeFileBtnText.style.display = isLoading ? 'none' : 'inline';
        analyzeFileBtnSpinner.style.display = isLoading ? 'inline-block' : 'none';
        
        if (isLoading) {
            analyzeFileBtn.classList.add('loading');
        } else {
            analyzeFileBtn.classList.remove('loading');
        }
    }
}

// Check API Connection
fetch(`${API_URL}/health`)
    .then(response => response.json())
    .then(data => {
        console.log('API connection successful:', data);
    })
    .catch(error => {
        console.warn('API not reachable:', error);
        alert('Backend API not reachable. Please ensure the server is running.');
    });

// Sample Text for Testing
const sampleAI = "It is important to note that artificial intelligence has become increasingly prevalent in modern society. Furthermore, machine learning algorithms have demonstrated remarkable capabilities across various domains. Consequently, the implications of these technological advancements warrant careful consideration. Moreover, the ethical dimensions of AI deployment require thorough examination.";

const sampleHuman = "I've been thinking about AI lately. Like, it's everywhere now, you know? My phone has it, my car has it, even my fridge apparently has some kind of AI. It's pretty wild when you think about it. I'm not sure if it's all good though. What happens when these systems make mistakes?";

// Console helpers
window.loadSampleAI = () => {
    textInput.value = sampleAI;
    textInput.dispatchEvent(new Event('input'));
};

window.loadSampleHuman = () => {
    textInput.value = sampleHuman;
    textInput.dispatchEvent(new Event('input'));
};

console.log('AI Text Detector initialized');
console.log('Try: loadSampleAI() or loadSampleHuman()');