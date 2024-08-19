import WaveSurfer from 'https://unpkg.com/wavesurfer.js/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js/dist/plugins/regions.esm.js';

  
  //------------Fungsi untuk download JSON------------
function completeMakhraj() {
    const table = document.getElementById('annotationTableBody');
    const rows = table.getElementsByTagName('tr');
    const annotations = [];

    // Dapatkan nama file audio yang diupload
    const audioFile = document.getElementById('audioFile').files[0].name;
    const fileName = `annotation_makhraj_${audioFile.split('.')[0]}.json`; // Menyimpan dengan format yang diinginkan

for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    const annotation = {
        audio_file: audioFile,  // Menambahkan nama file audio ke dalam JSON
        letter: cells[0].textContent,
        makhraj: {
            primary: cells[1].textContent,
            secondary: cells[2].textContent,
            details: cells[3].textContent
        },
        start_time: parseFloat(cells[4].textContent),
        end_time: parseFloat(cells[5].textContent),
            metadata: {
                qori: "abdulsamad",
                recitation_style: "Hafs",
                recording_environment: cells[6].textContent,
                recording_quality: cells[7].textContent
            }
        };
        annotations.push(annotation);
    }

    const json = JSON.stringify(annotations, null, 2);
    downloadJSON(json, fileName);
}                                  
function completeTajwid() {
    const table = document.getElementById('annotationTableBodyTajwid');
    const rows = table.getElementsByTagName('tr');
    const annotations = [];

    // Dapatkan nama file audio yang diupload
    const audioFile = document.getElementById('audioFile').files[0].name;
    const fileName = `annotation_tajwid_${audioFile.split('.')[0]}.json`; // Menyimpan dengan format yang diinginkan

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const annotation = {
            rule: cells[0].textContent,
            sub_rule: cells[1].textContent,
            sub_sub_rule: cells[2].textContent,
            start_time: parseFloat(cells[3].textContent),
            end_time: parseFloat(cells[4].textContent),
            context: cells[5].textContent
        };
        annotations.push(annotation);
    }

    const json = JSON.stringify(annotations, null, 2);
    downloadJSON(json, fileName);
}                          
function downloadJSON(json, fileName) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; // Nama file diatur sesuai dengan input
    a.click();
    URL.revokeObjectURL(url);
}                        


//------------Untuk mengisi pilihan (dropdown) secara dinamis------------
const tajwidRuleSelect = document.getElementById('tajwidRule');
const tajwidSubRuleSelect = document.getElementById('tajwidSubRule');
const tajwidSubSubRuleSelect = document.getElementById('tajwidSubSubRule');

const tajwidOptions = {
    "Mad": {
        "Mad Thabi'i": ["Mad Thabi'i"],
        "Mad Far'i": ["Mad Wajib", "Mad Jaiz"]
    },
    "Hukum Nun Mati": {
        "Izhar": ["Izhar Halqi"],
        "Idgham": ["Idgham Bighunnah", "Idgham Bilaghunnah"],
        "Iqlab": ["Iqlab"],
        "Ikhfa": ["Ikhfa Haqiqi"]
    },
    "Hukum Mim Mati": {
        "Ikhfa Syafawi": ["Ikhfa Syafawi"],
        "Idgham Mitslain": ["Idgham Mitslain"]
    }
};

tajwidRuleSelect.addEventListener('change', function() {
    const selectedRule = tajwidRuleSelect.value;
    populateSubRules(selectedRule);
    tajwidSubSubRuleSelect.innerHTML = ''; // Clear sub-sub rule options when changing the rule
});

tajwidSubRuleSelect.addEventListener('change', function() {
    const selectedRule = tajwidRuleSelect.value;
    const selectedSubRule = tajwidSubRuleSelect.value;
    populateSubSubRules(selectedRule, selectedSubRule);
});

function populateSubRules(selectedRule) {
    tajwidSubRuleSelect.innerHTML = '';
    const subRules = tajwidOptions[selectedRule];
    for (let subRule in subRules) {
        let option = document.createElement('option');
        option.value = subRule;
        option.textContent = subRule;
        tajwidSubRuleSelect.appendChild(option);
    }
}

function populateSubSubRules(selectedRule, selectedSubRule) {
    tajwidSubSubRuleSelect.innerHTML = '';
    const subSubRules = tajwidOptions[selectedRule][selectedSubRule];
    subSubRules.forEach(function(subSubRule) {
        let option = document.createElement('option');
        option.value = subSubRule;
        option.textContent = subSubRule;
        tajwidSubSubRuleSelect.appendChild(option);
    });
}



//------------Script INTI------------
let wavesurfer = null;
let activeRegion = null;

function updateTimestamp() {
    const currentTime = wavesurfer.getCurrentTime();
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    document.getElementById('time').textContent = timeString;

    requestAnimationFrame(updateTimestamp);
}

// Inisialisasi plugin Regions
const regions = RegionsPlugin.create();

function uploadAudio() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    if (file) {
        if (wavesurfer) {
            wavesurfer.destroy(); // Hancurkan instance Wavesurfer yang ada, jika ada
            const annotationTableBody = document.getElementById('annotationTableBody');
            annotationTableBody.innerHTML = ''; // Mengosongkan bagian body dari tabel
        }

        const url = URL.createObjectURL(file);

        // Membuat instance Wavesurfer baru dengan plugin Regions
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#A8DBA8',
            progressColor: '#3B8686',
            backend: 'WebAudio',
            barWidth: 2,
            height: 200,
            responsive: true,
            cursorWidth: 1,
            pixelRatio: 1,
            minPxPerSec: 100, // Nilai ini akan diubah oleh slider zoom
            cursorColor: '#000',
            cursorStyle: 'solid',
            scrollParent: true, // Mengaktifkan scrollbar horizontal
            plugins: [
                regions // Inisialisasi plugin Regions
            ]
        });

        // Memuat audio
        wavesurfer.load(url);

        // Tombol Play/Pause
        document.getElementById('playPause').addEventListener('click', function() {
            wavesurfer.playPause();
        });

        // Tombol Stop
        document.getElementById('stop').addEventListener('click', function() {
            wavesurfer.stop();
        });

        // Tambahkan event listener ketika audio siap dimainkan
        wavesurfer.on('ready', function () {
            updateTimestamp();

            // Setup Zoom Slider
            const zoomSlider = document.getElementById('zoom-slider');
            zoomSlider.addEventListener('input', function() {
                const zoomLevel = Number(this.value);
                wavesurfer.zoom(zoomLevel); // Mengatur zoom level berdasarkan slider
            });
        });

        // Fungsi untuk menghasilkan warna acak
        const random = (min, max) => Math.random() * (max - min) + min;
        const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

        wavesurfer.on('decode', () => {
            // Regions
            regions.addRegion({
              start: 0.1,
              end: 0.5,
              content: 'Area Anotasi',
              color: randomColor(),
              minLength: 0.01,
              maxLength: 100,
            });
        });

        // Event listener untuk region in
        wavesurfer.on('region-in', (region) => {
            console.log('region-in', region);
            activeRegion = region;
            region.play(); // Memulai playback dalam region saat masuk ke region
        });
        
        // Event listener untuk region out
        wavesurfer.on('region-out', (region) => {
            console.log('region-out', region);
            if (activeRegion === region) {
                region.play(region.start); // Memutar ulang region ketika keluar dari region
            }
        });
        
        // Event listener untuk region click
        wavesurfer.on('region-click', (region, e) => {
            e.stopPropagation(); // Mencegah triggering a click on the waveform
            activeRegion = region;
            region.play(region.start);
            region.setOptions({ color: randomColor() });
        });
        
        // Reset active region saat user mengklik waveform di luar region
        wavesurfer.on('interaction', () => {
            activeRegion = null;
        });

    } else {
        alert("Please select a file to upload.");
    }
}


function showAnnotationFields() {
    const selectedType = document.getElementById('annotationType').value;
    document.getElementById('makhrajFields').classList.add('hidden');
    document.getElementById('tajwidFields').classList.add('hidden');
    document.getElementById('annotationList').classList.add('hidden');
    document.getElementById('annotationListTajwid').classList.add('hidden');
    document.getElementById('saveAnnotationBtn').classList.add('hidden');

    if (selectedType === 'makhraj') {
        document.getElementById('makhrajFields').classList.remove('hidden');
        document.getElementById('annotationList').classList.remove('hidden');
        document.getElementById('saveAnnotationBtn').classList.remove('hidden');
    } else if (selectedType === 'tajwid') {
        document.getElementById('tajwidFields').classList.remove('hidden');
        document.getElementById('annotationListTajwid').classList.remove('hidden');
        document.getElementById('saveAnnotationBtn').classList.remove('hidden');
    }
}        

function updateFieldsBasedOnLetter() {
    const letter = document.getElementById('makhrajLetter').value;
    let primaryMakhraj = '';
    let secondaryMakhraj = '';
    let details = '';

    switch (letter) {
        case 'ﺍ':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Bagian dalam tenggorokan';
            details = 'Hamzah (ﺍ), suara keluar dari bagian dalam tenggorokan.';
            break;
        case 'ب':
            primaryMakhraj = 'Shafatan';
            secondaryMakhraj = 'Bibir atas';
            details = 'Ba (ب), suara keluar dari kedua bibir.';
            break;
        case 'ت':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Ta (ت), suara keluar dari ujung lidah dan ujung gigi atas.';
            break;
        case 'ث':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Tha (ث), suara keluar dari ujung lidah dan ujung gigi seri atas.';
            break;
        case 'ج':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Tengah lidah';
            details = 'Jim (ج), suara keluar dari tengah lidah dan langit-langit tengah mulut.';
            break;
        case 'ح':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Tengah tenggorokan';
            details = 'Ha (ح), suara keluar dari tengah tenggorokan.';
            break;
        case 'خ':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Ujung tenggorokan';
            details = 'Kha (خ), suara keluar dari ujung tenggorokan.';
            break;
        case 'د':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Dal (د), suara keluar dari ujung lidah dan ujung gigi atas.';
            break;
        case 'ذ':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Dzal (ذ), suara keluar dari ujung lidah dan ujung gigi seri atas.';
            break;
        case 'ر':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Ra (ر), suara keluar dari ujung lidah dan sedikit menggulung.';
            break;
        case 'ز':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Zay (ز), suara keluar dari ujung lidah dan gigi atas dengan sedikit desiran.';
            break;
        case 'س':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Sin (س), suara keluar dari ujung lidah dan ujung gigi seri atas.';
            break;
        case 'ش':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Tengah lidah';
            details = 'Shin (ش), suara keluar dari tengah lidah dan langit-langit tengah mulut.';
            break;
        case 'ص':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Sad (ص), suara keluar dari ujung lidah dan ujung gigi seri atas dengan desiran.';
            break;
        case 'ض':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Sisi lidah';
            details = 'Dhad (ض), suara keluar dari sisi lidah dan gigi seri atas.';
            break;
        case 'ط':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'To (ط), suara keluar dari ujung lidah dan gigi atas dengan tekanan kuat.';
            break;
        case 'ظ':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Dho (ظ), suara keluar dari ujung lidah dan ujung gigi seri atas dengan tekanan kuat.';
            break;
        case 'ع':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Tengah tenggorokan';
            details = 'Ain (ع), suara keluar dari tengah tenggorokan.';
            break;
        case 'غ':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Ujung tenggorokan';
            details = 'Ghain (غ), suara keluar dari ujung tenggorokan dengan getaran.';
            break;
        case 'ف':
            primaryMakhraj = 'Shafatan';
            secondaryMakhraj = 'Bibir bawah';
            details = 'Fa (ف), suara keluar dari bibir bawah dan ujung gigi seri atas.';
            break;
        case 'ق':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Pangkal lidah';
            details = 'Qaf (ق), suara keluar dari pangkal lidah dan langit-langit lunak.';
            break;
        case 'ك':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Pangkal lidah';
            details = 'Kaf (ك), suara keluar dari pangkal lidah dan langit-langit keras.';
            break;
        case 'ل':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Lam (ل), suara keluar dari ujung lidah dan langit-langit depan.';
            break;
        case 'م':
            primaryMakhraj = 'Shafatan';
            secondaryMakhraj = 'Bibir atas';
            details = 'Mim (م), suara keluar dari kedua bibir dengan rapat sempurna.';
            break;
        case 'ن':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Nun (ن), suara keluar dari ujung lidah dan langit-langit depan dengan getaran halus.';
            break;
        case 'و':
            primaryMakhraj = 'Shafatan';
            secondaryMakhraj = 'Bibir atas';
            details = 'Waw (و), suara keluar dari kedua bibir dengan bulat sempurna.';
            break;
        case 'ه':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Tengah tenggorokan';
            details = 'Ha (ه), suara keluar dari tengah tenggorokan dengan tekanan ringan.';
            break;
        case 'ي':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Tengah lidah';
            details = 'Ya (ي), suara keluar dari tengah lidah dan langit-langit tengah mulut.';
            break;
        default:
            primaryMakhraj = '';
            secondaryMakhraj = '';
            details = '';
    }
    
    document.getElementById('makhrajPrimary').value = primaryMakhraj;
    document.getElementById('makhrajSecondary').value = secondaryMakhraj;
    document.getElementById('makhrajDetails').value = details;
}

function saveAnnotation() {
const annotationType = document.getElementById('annotationType').value;

if (annotationType === 'makhraj') {
    if (activeRegion) {
        const letter = document.getElementById('makhrajLetter').value;
        const primary = document.getElementById('makhrajPrimary').value;
        const secondary = document.getElementById('makhrajSecondary').value;
        const details = document.getElementById('makhrajDetails').value;
        const startTime = activeRegion.start.toFixed(3); // Gunakan waktu dari region
        const endTime = activeRegion.end.toFixed(3); // Gunakan waktu dari region
        const recordingEnvironment = document.getElementById('recordingEnvironment').value;
        const recordingQuality = document.getElementById('recordingQuality').value;

        const row = document.createElement('tr');
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
        document.getElementById('annotationTableBody').appendChild(row);}
    } else if (annotationType === 'tajwid') {
        // Proses untuk Anotasi Tajwid
        const rule = document.getElementById('tajwidRule').value;
        const subRule = document.getElementById('tajwidSubRule').value;
        const subSubRule = document.getElementById('tajwidSubSubRule').value;
        const startTime = document.getElementById('tajwidStartTime').value;
        const endTime = document.getElementById('tajwidEndTime').value;
        const context = document.getElementById('tajwidContext').value;

        const row = document.createElement('tr');
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
    // Menghapus row dari tabel
    element.parentElement.parentElement.remove();
}


// Menambahkan fungsi ke global scope
window.uploadAudio = uploadAudio;
window.showAnnotationFields = showAnnotationFields;
window.updateFieldsBasedOnLetter = updateFieldsBasedOnLetter;
window.completeMakhraj = completeMakhraj;
window.completeTajwid = completeTajwid;
window.saveAnnotation = saveAnnotation;
window.deleteAnnotation = deleteAnnotation;
