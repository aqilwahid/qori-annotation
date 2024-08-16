import WaveSurfer from 'https://unpkg.com/wavesurfer.js/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js/dist/plugins/regions.esm.js';

let wavesurfer = null;

function updateTimestamp() {
    const currentTime = wavesurfer.getCurrentTime();
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    document.getElementById('time').textContent = timeString;

    requestAnimationFrame(updateTimestamp);
}

export function uploadAudio() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];
    if (file) {
        const url = URL.createObjectURL(file);

        const wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#A8DBA8',
            progressColor: '#3B8686',
            backend: 'WebAudio',
            barWidth: 2,
            height: 200,
            responsive: true,
            cursorWidth: 1,
            pixelRatio: 1,
            minPxPerSec: 100,
            cursorColor: '#000',
            cursorStyle: 'solid',
            plugins: [
                RegionsPlugin.create({
                    dragSelection: {
                        slop: 5,
                        color: 'rgba(0, 0, 255, 0.1)',
                    }
                })
            ]
        });

        wavesurfer.load(url);

        document.getElementById('playPause').addEventListener('click', () => wavesurfer.playPause());
        document.getElementById('stop').addEventListener('click', () => wavesurfer.stop());

        wavesurfer.on('ready', () => {
            updateTimestamp();
            const cursor = document.querySelector('.wavesurfer-cursor');
            if (cursor) {
                cursor.classList.add('waveform-cursor');
            }
        });
        
        wavesurfer.on('region-created', (region) => {
            console.log('Region created:', region);
        });

        wavesurfer.on('region-updated', (region) => {
            console.log('Region updated:', region);
        });

        wavesurfer.on('region-removed', (region) => {
            console.log('Region removed:', region);
        });
    } else {
        alert("Please select a file to upload.");
    }
}

function showAnnotationFields() {
    const selectedType = document.getElementById('annotationType').value;
    ['makhrajFields', 'tajwidFields', 'annotationList', 'annotationListTajwid', 'saveAnnotationBtn'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    if (selectedType === 'makhraj') {
        ['makhrajFields', 'annotationList', 'saveAnnotationBtn'].forEach(id => {
            document.getElementById(id).classList.remove('hidden');
        });
    } else if (selectedType === 'tajwid') {
        ['tajwidFields', 'annotationListTajwid', 'saveAnnotationBtn'].forEach(id => {
            document.getElementById(id).classList.remove('hidden');
        });
    }
}

function updateFieldsBasedOnLetter() {
    const letter = document.getElementById('makhrajLetter').value;
    const makhrajMap = {
        'ﺍ': { primary: 'Halaq', secondary: 'Bagian dalam tenggorokan', details: 'Hamzah (ﺍ), suara keluar dari bagian dalam tenggorokan.' },
        'ب': { primary: 'Shafatan', secondary: 'Bibir atas', details: 'Ba (ب), suara keluar dari kedua bibir.' },
        // Add more mappings here
    };

    const { primary = '', secondary = '', details = '' } = makhrajMap[letter] || {};

    document.getElementById('makhrajPrimary').value = primary;
    document.getElementById('makhrajSecondary').value = secondary;
    document.getElementById('makhrajDetails').value = details;
}

function saveAnnotation() {
    const annotationType = document.getElementById('annotationType').value;
    let row = document.createElement('tr');

    if (annotationType === 'makhraj') {
        const letter = document.getElementById('makhrajLetter').value;
        const primary = document.getElementById('makhrajPrimary').value;
        const secondary = document.getElementById('makhrajSecondary').value;
        const details = document.getElementById('makhrajDetails').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const recordingEnvironment = document.getElementById('recordingEnvironment').value;
        const recordingQuality = document.getElementById('recordingQuality').value;

        row.innerHTML = `
            <td>${letter}</td>
            <td>${primary}</td>
            <td>${secondary}</td>
            <td>${details}</td>
            <td>${startTime}</td>
            <td>${endTime}</td>
            <td>${recordingEnvironment}</td>
            <td>${recordingQuality}</td>
            <td><span class="delete-icon" onclick="deleteAnnotation(this)">🗑️</span></td>
        `;
        document.getElementById('annotationTableBody').appendChild(row);
    } else if (annotationType === 'tajwid') {
        const rule = document.getElementById('tajwidRule').value;
        const subRule = document.getElementById('tajwidSubRule').value;
        const subSubRule = document.getElementById('tajwidSubSubRule').value;
        const startTime = document.getElementById('tajwidStartTime').value;
        const endTime = document.getElementById('tajwidEndTime').value;
        const context = document.getElementById('tajwidContext').value;

        row.innerHTML = `
            <td>${rule}</td>
            <td>${subRule}</td>
            <td>${subSubRule}</td>
            <td>${startTime}</td>
            <td>${endTime}</td>
            <td>${context}</td>
            <td><span class="delete-icon" onclick="deleteAnnotation(this)">🗑️</span></td>
        `;
        document.getElementById('annotationTableBodyTajwid').appendChild(row);
    }
}

function deleteAnnotation(element) {
    element.parentElement.parentElement.remove();
}
