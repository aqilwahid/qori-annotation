import WaveSurfer from 'https://unpkg.com/wavesurfer.js/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js/dist/plugins/regions.esm.js';

const regions = RegionsPlugin.create();

const ws = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'rgb(200, 0, 200)',
    progressColor: 'rgb(100, 0, 100)',
    url: 'audio_0.wav',
    plugins: [regions],
  });

  ws.on('decode', () => {
    regions.addRegion({
      start: 9,
      end: 10,
      content: 'Cramped region',
      color: randomColor(),
      minLength: 1,
      maxLength: 10,
    });
  });
  
  regions.enableDragSelection({
    color: 'rgba(255, 0, 0, 0.1)',
  });
  regions.on('region-updated', (region) => {
    console.log('Updated region', region);
  });
  
  regions.on('region-in', (region) => {
    console.log('region-in', region);
    activeRegion = region;
  });
  
  regions.on('region-out', (region) => {
    console.log('region-out', region);
    if (activeRegion === region) {
      if (loop) {
        region.play();
      } else {
        activeRegion = null;
      }
    }
  });
  
  regions.on('region-clicked', (region, e) => {
    e.stopPropagation();
    activeRegion = region;
    region.play();
    region.setOptions({ color: randomColor() });
  });
  
let loop = true;
document.querySelector('input[type="checkbox"]').onclick = (e) => {
  loop = e.target.checked;
};

document.querySelector('input[type="range"]').oninput = (e) => {
    const minPxPerSec = Number(e.target.value);
    ws.zoom(minPxPerSec);
  };
  
