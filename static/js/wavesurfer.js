import WaveSurfer from 'https://unpkg.com/wavesurfer.js/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js/dist/plugins/regions.esm.js';


//------------Script INTI------------
let wavesurfer


// Fungsi untuk mengupdate waktu
function updateTimestamp() {
    const currentTime = wavesurfer.getCurrentTime();
    
    // Hitung menit, detik, dan milidetik
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100); // 2 digit milidetik
    
    // Format waktu menjadi 0.00.00
    const timeString = `${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    document.getElementById('time').textContent = timeString;

    // Meminta pembaruan timestamp secara terus menerus
    requestAnimationFrame(updateTimestamp);
}


function changePlaybackRate() {
    // Mendapatkan elemen Wavesurfer
    const playbackRateElement = document.getElementById('playbackRate');

    // Mendapatkan nilai kecepatan yang dipilih
    const selectedRate = playbackRateElement.value;

    // Jika Wavesurfer sudah diinisialisasi
    if (wavesurfer) {
        // Mengatur kecepatan pemutaran audio
        wavesurfer.setPlaybackRate(parseFloat(selectedRate));
    } else {
        console.error('Wavesurfer belum diinisialisasi.');
    }
}


// Fungsi untuk memuat CSV dari server
async function loadAyahDataFromCSV(csvPath) {
    try {
        const response = await fetch(csvPath);
        const csvText = await response.text();
        const ayahArray = csvToArray(csvText);
        return ayahArray;
    } catch (error) {
        console.error("Error loading CSV:", error);
        return [];
    }
}

// Fungsi untuk mengonversi teks CSV menjadi array objek
function csvToArray(str, delimiter = ",") {
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");

    const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        if (values.length !== headers.length) {
            return null;  // Abaikan baris yang tidak sesuai
        }
        const el = headers.reduce(function (object, header, index) {
            if (values[index] !== undefined) {
                object[header.trim()] = values[index].trim();
            }
            return object;
        }, {});
        return el;
    }).filter(row => row !== null); // Filter baris null

    return arr;
}


// Fungsi untuk menampilkan teks ayat berdasarkan path audio
function displayAyahByAudioPath(audioPath, ayahData) {
    console.log("Searching for:", audioPath);
    const ayah = ayahData.find(a => a.local_audio_path.toLowerCase() === audioPath.toLowerCase());
    const ayahTextElement = document.getElementById('ayah-text');

    if (ayah) {
        ayahTextElement.innerHTML = ayah.text;
    } else {
        console.log("Ayat tidak ditemukan untuk:", audioPath);
        ayahTextElement.innerHTML = 'Ayat tidak ditemukan untuk audio ini.';
    }
}



// Inisialisasi plugin Regions
const regions = RegionsPlugin.create();

async function uploadAudio() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    if (file) {
        if (wavesurfer) {
            wavesurfer.destroy(); // Hancurkan instance Wavesurfer yang ada, jika ada
            const annotationTableBody = document.getElementById('annotationTableBody');
            annotationTableBody.innerHTML = ''; // Mengosongkan bagian body dari tabel
        }

        const url = URL.createObjectURL(file);

        // Load data ayat dari CSV
        const qoriSelection = document.getElementById('qori-selection').value;
        let filePath;

        if (qoriSelection === "Abdulsamad") {
        filePath = '/static/audio/audio_statistics_abdulsamad.csv';
        } else {
        filePath = '/static/audio/audio_statistics_ali_basfar.csv';
        }

        // Load data from the selected file
        const ayahData = await loadAyahDataFromCSV(filePath);


        // Memanggil fungsi untuk menampilkan teks ayat berdasarkan file audio
        displayAyahByAudioPath(file.name, ayahData); // Menggunakan nama file untuk mencocokkan teks ayat

        // Membuat instance Wavesurfer baru dengan plugin Regions
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#A8DBA8',
            progressColor: '#3B8686',
            backend: 'WebAudio',
            barWidth: 2,
            height: 200,
            responsive: true,
            cursorWidth: 0,  // Disable cursor
            pixelRatio: 1,
            minPxPerSec: 100,
            scrollParent: true,
            plugins: [ regions ]
        });

        // Memuat audio
        wavesurfer.load(url);

        // Tombol Play/Pause
        document.getElementById('playPause').addEventListener('click', function() {
            wavesurfer.playPause();
        });

        document.getElementById('stop').addEventListener('click', function() {
            wavesurfer.stop();
        });

        wavesurfer.on('ready', function () {
            updateTimestamp();

            const zoomSlider = document.getElementById('zoom-slider');
            zoomSlider.addEventListener('input', function() {
                const zoomLevel = Number(this.value);
                wavesurfer.zoom(zoomLevel);
            });
        });

        // Fungsi untuk warna region
        wavesurfer.on('decode', () => {
            // Regions
            regions.addRegion({
                start: 0.1,
                end: 0.5,
                content: 'Area Anotasi',
                color: 'rgba(135, 206, 235, 0.5)', // Warna biru langit
                minLength: 0.01,
                maxLength: 100,
            });
        });
        

         // Fungsi untuk mengupdate start dan end time
        function updateStartEndTime(region) {
            // Format waktu ke dalam format yang diinginkan 0.00.00
            const formattedStartTime = formatTime(region.start);
            const formattedEndTime = formatTime(region.end);

            // Tampilkan waktu ke elemen di UI
            document.getElementById('start-time-display').textContent = `Start: ${formattedStartTime}`;
            document.getElementById('end-time-display').textContent = `End: ${formattedEndTime}`;

            // Simpan waktu ke input form yang relevan berdasarkan jenis anotasi
            const annotationType = document.getElementById('annotationType').value;
            if (annotationType === 'makhraj') {
                document.getElementById('makhrajStartTime').value = formattedStartTime;
                document.getElementById('makhrajEndTime').value = formattedEndTime;
            } else if (annotationType === 'tajwid') {
                document.getElementById('tajwidStartTime').value = formattedStartTime;
                document.getElementById('tajwidEndTime').value = formattedEndTime;
            }
        }

        function formatTime(timeInSeconds) {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const milliseconds = Math.floor((timeInSeconds % 1) * 100); // 2 digit milidetik
        
            return `${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        }
        

        // Event listener untuk region update 
        wavesurfer.on('region-created', (region) => {
            activeRegion = region;
            updateStartEndTime(region);
        });

        wavesurfer.on('region-updated', (region) => {
            updateStartEndTime(region);
        });

        wavesurfer.on('region-click', (region, e) => {
            e.stopPropagation();
            activeRegion = region;
            region.play();
            updateStartEndTime(region);
        });

        let activeRegion = null;
        wavesurfer.on('region-in', (region) => {
            console.log('region-in', region);
            activeRegion = region;
        });

        wavesurfer.on('region-out', (region) => {
            console.log('region-out', region);
            if (activeRegion === region) {
                activeRegion = null;
            }
        });

        // Reset active region saat user mengklik waveform
        wavesurfer.on('interaction', () => {
            if (activeRegion) {
                activeRegion.remove();
                activeRegion = null;
            }
        });
    } else {
        alert("Please select a file to upload.");
    }
}


//------------Fungsi untuk download JSON------------
function completeMakhraj() {
    const table = document.getElementById('annotationTableBody');
    const rows = table.getElementsByTagName('tr');
    const annotations = [];

    // Pengecekan apakah file audio sudah dipilih
    const fileInput = document.getElementById('audioFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please upload an audio file first.");
        return; // Hentikan fungsi jika file belum dipilih
    }

    // Dapatkan nama file audio yang diupload
    const audioFile = fileInput.files[0].name;
    const fileName = `annotation_makhraj_${audioFile.split('.')[0]}.json`; // Menyimpan dengan format yang diinginkan

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const annotation = {
            audio_file: audioFile,  // Menambahkan nama file audio ke dalam JSON
            letter: cells[0].textContent || '-',
            makhraj: {
                primary: cells[1].textContent || '-',
                secondary: cells[2].textContent || '-',
                details: cells[3].textContent || '-'
            },
            start_time: cells[4].textContent || '-',  // Pastikan diambil dari format yang benar
            end_time: cells[5].textContent || '-',    // Pastikan diambil dari format yang benar
            metadata: {
                qori: "abdulsamad",
                recitation_style: "Hafs",
                recording_environment: cells[6].textContent || '-',
                recording_quality: cells[7].textContent || '-'
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

     // Pengecekan apakah file audio sudah dipilih
     const fileInput = document.getElementById('audioFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please upload an audio file first.");
        return; // Hentikan fungsi jika file belum dipilih
    }

    // Dapatkan nama file audio yang diupload
    const audioFile = fileInput.files[0].name;
    const fileName = `annotation_tajwid_${audioFile.split('.')[0]}.json`; // Menyimpan dengan format yang diinginkan

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const annotation = {
            rule: cells[0].textContent || '-',
            sub_rule: cells[1].textContent || '-',
            sub_sub_rule: cells[2].textContent || '-',
            start_time: cells[3].textContent || '-',
            end_time: cells[4].textContent || '-',
            context: cells[5].textContent || '-'
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
        "Mad Far'i": [
            "Mad Wajib Muttashil", 
            "Mad Jaiz Munfashil", 
            "Mad 'Aridh Lissukun",
            "Mad Lazim Kalimi Muthawwal",
            "Mad Lazim Harfi Muthawwal",
            "Mad Lin",
            "Mad Badal",
            "Mad Silah Qashirah",
            "Mad Silah Tawilah",
            "Mad 'Iwadh",
            "Mad Lazim Kalimi Mukhaffaf",
            "Mad Lazim Harfi Mukhaffaf",
            "Mad Farqi",
            "Mad Tamkin"
        ]
    },
    "Hukum Nun Mati": {
        "Izhar": ["Izhar Halqi"],
        "Idgham": ["Idgham Bighunnah", "Idgham Bilaghunnah"],
        "Iqlab": ["Iqlab"],
        "Ikhfa": ["Ikhfa Haqiqi"]
    },
    "Hukum Mim Mati": {
        "Ikhfa Syafawi": ["Ikhfa Syafawi"],
        "Idgham Mitslain": ["Idgham Mitslain"],
        "Idzhar Syafawi": ["Idzhar Syafawi"]
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
        case 'ء':
            primaryMakhraj = 'Halaq';
            secondaryMakhraj = 'Bagian dalam tenggorokan';
            details = 'Hamzah (ء), suara keluar dari bagian dalam tenggorokan.';
            break;
        case 'ب':
            primaryMakhraj = 'Shafatan';
            secondaryMakhraj = 'Bibir atas';
            details = 'Ba (ب), suara keluar dari kedua bibir.';
            break;
        case 'ت':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Ta (ت), suara keluar dari ujung lidah dan pangkal gigi seri atas.';
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
            details = 'Dal (د), suara keluar dari ujung lidah dan pangkal gigi seri atas.';
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
            details = 'Zay (ز), suara keluar dari ujung lidah dan gigi seri bawah dengan sedikit desiran.';
            break;
        case 'س':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Sin (س), suara keluar dari ujung lidah dan gigi seri bawah.';
            break;
        case 'ش':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Tengah lidah';
            details = 'Shin (ش), suara keluar dari tengah lidah dan langit-langit tengah mulut.';
            break;
        case 'ص':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'Sad (ص), suara keluar dari ujung lidah dan gigi seri bawah dengan desiran.';
            break;
        case 'ض':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Sisi lidah';
            details = 'Dhad (ض), suara keluar dari sisi lidah dan gigi seri atas.';
            break;
        case 'ط':
            primaryMakhraj = 'Lisan';
            secondaryMakhraj = 'Ujung lidah';
            details = 'To (ط), suara keluar dari ujung lidah dan pangkal gigi seri atas dengan tekanan kuat.';
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
        // Proses untuk Anotasi Makhraj
        const letter = document.getElementById('makhrajLetter').value;
        const primary = document.getElementById('makhrajPrimary').value;
        const secondary = document.getElementById('makhrajSecondary').value;
        const details = document.getElementById('makhrajDetails').value;
        const startTime = document.getElementById('makhrajStartTime').value;
        const endTime = document.getElementById('makhrajEndTime').value;
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
        document.getElementById('annotationTableBody').appendChild(row);
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
window.changePlaybackRate = changePlaybackRate;