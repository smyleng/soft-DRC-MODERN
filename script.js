// ---------- MOT DE PASSE MENSUEL ----------
const currentPassword = "1234"; // À changer chaque mois

// Sélection des éléments
const scanBtn = document.getElementById('scanBtn');
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const loading = document.getElementById('loading');
const progressFill = document.getElementById('progressFill');

const passwordContainer = document.getElementById('passwordContainer');
const passwordInput = document.getElementById('passwordInput');
const unlockBtn = document.getElementById('unlockBtn');
const appContent = document.getElementById('appContent');

// Débloquer l'application avec le mot de passe
unlockBtn.addEventListener('click', () => {
  if(passwordInput.value.trim() === currentPassword){
    passwordContainer.style.display = 'none';
    appContent.style.display = 'block';
  } else {
    alert("Mot de passe incorrect.");
  }
});

// ---------- OCR avec Tesseract ----------
scanBtn.addEventListener('click', () => {
  const file = imageInput.files[0];
  if(!file){ alert("Veuillez sélectionner une image."); return; }

  output.textContent = '';
  progressFill.style.width = '0%';
  loading.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = function(){
    Tesseract.recognize(reader.result, 'fra+eng', {
      logger: m=>{
        if(m.status==='recognizing text'){
          const percent = Math.floor(m.progress*100);
          progressFill.style.width = percent+'%';
        }
      }
    }).then(({data:{text}})=>{
      loading.classList.add('hidden');
      output.textContent = text.trim();
    }).catch(err=>{
      loading.classList.add('hidden');
      output.textContent="Erreur lors de l'extraction du texte.";
      console.error(err);
    });
  };
  reader.readAsDataURL(file);
});

// ---------- Copier texte ----------
document.getElementById('copyBtn').addEventListener('click', ()=>{
  const text = output.textContent;
  if(text) navigator.clipboard.writeText(text).then(()=>alert('Texte copié !'));
});

// ---------- Partager texte ----------
document.getElementById('shareBtn').addEventListener('click', ()=>{
  const text = output.textContent;
  if(navigator.share && text) navigator.share({text}).catch(err=>console.error(err));
  else alert("Partage non supporté sur cet appareil.");
});
