// Sélection des éléments
const scanBtn = document.getElementById('scanBtn');
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const loading = document.getElementById('loading');
const progressFill = document.getElementById('progressFill');
const licenseContainer = document.getElementById('licenseContainer');
const tokenInput = document.getElementById('tokenInput');
const tokenBtn = document.getElementById('tokenBtn');
const licenseMessage = document.getElementById('licenseMessage');

// PUBLIC KEY pour vérifier le token/licence
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnmLhVgifkzoB+7rwJf8E
0RHbcjPhOoZjCmBFPtgpqLhTCFLTOB9XvDfM4ygJY70HDObLmH4EoktY94ad9HNp
O7rtX1EIMYSgLNoz+g7PfA2IA79uX2XVsHPvHf+kYaKXypjNHwvXGICpnMTja3wr
s9N9lna71+rLNEK6xbtmVYSgqRXwV+4VJ1GYUkLDOUNNLVz9lfUf2bH/Xz+OpIP4
NNY5ev8y5QjkXsXqoN19v6DdYCcG/JCOJ6GNZSBo64ZxR3PrlsEooGGAEozb8z9b
Rav2YF39hvQ9DlIQVFgR2ytDEQechU+riuPs1Zy18AnVNcb7ht9ncXqdf4DOPhlr
hQIDAQAB
-----END PUBLIC KEY-----`;

// Fonction utilitaire pour convertir PEM en ArrayBuffer
function str2ab(pem) {
  const b64 = pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, '');
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Vérification du token/licence
async function verifyToken(token){
  try {
    const [payloadB64, sigB64] = token.split('.');
    const payload = atob(payloadB64);
    const sig = Uint8Array.from(atob(sigB64), c=>c.charCodeAt(0));
    const enc = new TextEncoder();

    const key = await window.crypto.subtle.importKey(
      "spki", str2ab(publicKey), { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" }, false, ["verify"]
    );

    const valid = await window.crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, enc.encode(payload));
    if(!valid) return false;

    const data = JSON.parse(payload);
    const expiry = new Date(data.expiry);
    return expiry > new Date();
  } catch(e) {
    console.error(e);
    return false;
  }
}

// Vérification token sauvegardé
let savedToken = localStorage.getItem('userToken');
if(savedToken) checkToken(savedToken);

// Bouton valider token
tokenBtn.addEventListener('click', ()=>{
  const token = tokenInput.value.trim();
  if(token){
    localStorage.setItem('userToken', token);
    checkToken(token);
  }
});

// Fonction pour vérifier le token
async function checkToken(token){
  const valid = await verifyToken(token);
  if(valid){
    licenseContainer.style.display = 'none';
    alert("Licence validée ! Vous pouvez utiliser l'application.");
  } else {
    licenseMessage.textContent = "Licence invalide ou expirée. Contactez le fournisseur pour recevoir un nouveau token.";
  }
}

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
