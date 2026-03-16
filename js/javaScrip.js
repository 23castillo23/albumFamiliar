/**
 * =====================================================================
 * ÁLBUM FAMILIAR — Cómo agregar un álbum nuevo:
 *
 * 1. En Cloudinary: sube tus fotos y asígnales un tag (ej: "navidad_2025")
 * 2. Aquí abajo, agrega un objeto al array ALBUMS con:
 *      - cloudinaryTag: el tag que usaste en Cloudinary
 *      - photos: []  ← déjalo vacío, se llenará automáticamente
 * 3. ¡Listo! No necesitas copiar ningún link.
 *
 * Ejemplo:
 *   {
 *     id: 'navidad-2025',
 *     name: 'Navidad 2025',
 *     icon: '🎄',
 *     cloudinaryTag: 'navidad_2025',   ← tag asignado en Cloudinary
 *     coverImage: '',                  ← se pone automáticamente
 *     photos: [],                      ← se llena automáticamente
 *   },
 * =====================================================================
 */

const CLOUDINARY_CLOUD = 'dwjzn6n0a'; // ← Tu cloud name de Cloudinary

const ALBUMS = [
  // --- Álbumes con fotos fijas (sin tag) ---

  // --- Álbumes que se cargan automáticamente desde un tag de Cloudinary ---
    // ¿Quieres agregar un álbum nuevo? Copia este bloque y personalízalo:
  // {
  //   id: 'mi-nuevo-album',
  //   name: 'Mi Nuevo Álbum',
  //   icon: '📸',
  //   cloudinaryTag: 'mi_tag_en_cloudinary',
  //   coverImage: '',
  //   photos: [],
  // },
  {
    id: 'cerro',
    name: 'cerroBorrego',
    icon: '🎨',
    cloudinaryTag: 'cerro_borrego', // ← tag en Cloudinary
    coverImage: '',               // se asigna automáticamente
    photos: [],                   // se llena automáticamente
  },
  {
    id: 'zoo',
    name: 'zoo Mexico',
    icon: '🎨',
    cloudinaryTag: 'zoo_mex', // ← tag en Cloudinary
    coverImage: '',               // se asigna automáticamente
    photos: [],                   // se llena automáticamente
  },
  {
    id: 'Dibujos',
    name: 'Mis dibujos',
    icon: '🎨',
    cloudinaryTag: 'mis_dibujos', // ← tag en Cloudinary
    coverImage: '',               // se asigna automáticamente
    photos: [],                   // se llena automáticamente
  },
];

// =====================================================================
// Carga automática de fotos desde Cloudinary usando tags
// No necesitas modificar nada de aquí para abajo.
// =====================================================================

async function cargarAlbumsDesdeCloudinary() {
  const albumsConTag = ALBUMS.filter(a => a.cloudinaryTag);
  await Promise.allSettled(
    albumsConTag.map(album => cargarFotosDeAlbum(album))
  );
  renderAlbums();
}

async function cargarFotosDeAlbum(album) {
  const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/list/${album.cloudinaryTag}.json`;
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const datos = await respuesta.json();
    if (!datos.resources || datos.resources.length === 0) {
      console.warn(`El tag "${album.cloudinaryTag}" no tiene imágenes en Cloudinary.`);
      return;
    }

    album.photos = datos.resources.map(foto => ({
      src: `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/v${foto.version}/${foto.public_id}.${foto.format}`,
      caption: foto.context?.custom?.caption || foto.public_id,
    }));

    if (!album.coverImage && album.photos.length > 0) {
      album.coverImage = album.photos[0].src;
    }

    console.log(`"${album.name}": ${album.photos.length} fotos cargadas (tag: "${album.cloudinaryTag}").`);

  } catch (error) {
    console.error(`No se pudieron cargar las fotos de "${album.name}" (tag: "${album.cloudinaryTag}"):`, error.message);
  }
}

// =====================================================================
// Referencias al DOM
// =====================================================================
const albumsGrid      = document.getElementById('albumsGrid');
const gallerySection  = document.getElementById('gallerySection');
const albumsSection   = document.querySelector('.albums-section');
const photosGrid      = document.getElementById('photosGrid');
const galleryTitle    = document.getElementById('galleryTitle');
const btnBack         = document.getElementById('btnBack');
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose   = document.getElementById('lightboxClose');
const lightboxPrev    = document.getElementById('lightboxPrev');
const lightboxNext    = document.getElementById('lightboxNext');
const commentsModal       = document.getElementById('commentsModal');
const commentsModalClose  = document.getElementById('commentsModalClose');
const commentsModalTitle  = document.getElementById('commentsModalTitle');
const commentsModalList   = document.getElementById('commentsModalList');
const commentsModalForm   = document.getElementById('commentsModalForm');
const commentsModalAuthor = document.getElementById('commentsModalAuthor');
const commentsModalText   = document.getElementById('commentsModalText');

let currentAlbum = null;
let currentPhotoIndex = 0;
let currentZoom = 1;
let panX = 0, panY = 0;
let isPanning = false;
let startPanX = 0, startPanY = 0;
let startClientX = 0, startClientY = 0;
const MIN_ZOOM = 1, MAX_ZOOM = 3, ZOOM_STEP = 0.25;
const commentListenersByPhoto = {};
let currentCommentsPhotoId = null;

// =====================================================================
// Zoom y paneo del lightbox
// =====================================================================
function applyZoom() {
  lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
  lightboxImg.style.cursor = currentZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'grab';
}

// =====================================================================
// Firestore: comentarios y likes
// =====================================================================
function getSafePhotoId(photoSrc) {
  return btoa(photoSrc).replace(/\//g, '_');
}

function setupCommentsListenerForPhoto(photoId, commentsListEl) {
  if (!window._firestoreDb || !window._firestoreLib) return;
  const db = window._firestoreDb;
  const { collection, query, where, onSnapshot } = window._firestoreLib;

  if (commentListenersByPhoto[photoId]) commentListenersByPhoto[photoId]();

  const q = query(collection(db, 'comments'), where('photoId', '==', photoId));
  const unsub = onSnapshot(q, (snapshot) => {
    commentsListEl.innerHTML = '';
    const docs = [];
    snapshot.forEach(doc => docs.push(doc.data()));
    docs.sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return ta - tb;
    });
    docs.forEach(data => {
      const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '';
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `
        <div class="comment-item-author">${escapeHtml(data.author || 'Anónimo')}</div>
        <div class="comment-item-text">${escapeHtml(data.text || '')}</div>
        <div class="comment-item-date">${escapeHtml(date)}</div>
      `;
      commentsListEl.appendChild(div);
    });
    commentsListEl.scrollTop = commentsListEl.scrollHeight;
  });
  commentListenersByPhoto[photoId] = unsub;
}

function setupLikesForPhoto(photoId, likeBtn, likeCountEl) {
  if (!window._firestoreDb || !window._firestoreLib) return;
  const db = window._firestoreDb;
  const { doc, setDoc, increment, onSnapshot } = window._firestoreLib;
  const likeDocRef = doc(db, 'likes', getSafePhotoId(photoId));
  onSnapshot(likeDocRef, (snap) => {
    if (likeCountEl) likeCountEl.textContent = snap.data()?.count || 0;
  });
  likeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await setDoc(likeDocRef, { count: increment(1) }, { merge: true });
    } catch (err) {
      console.error('Error incrementando likes', err);
    }
  });
}

function initPhotoInteractions(photoItemEl, photo) {
  const likeBtn     = photoItemEl.querySelector('.btn-like');
  const likeCountEl = photoItemEl.querySelector('.like-count');
  const commentsBtn = photoItemEl.querySelector('.btn-comments');
  if (likeBtn && likeCountEl) setupLikesForPhoto(photo.src, likeBtn, likeCountEl);
  if (commentsBtn) commentsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommentsModal(photo);
  });
}

function openCommentsModal(photo) {
  if (!commentsModal) return;
  currentCommentsPhotoId = photo.src;
  commentsModalTitle.textContent = photo.caption || 'Comentarios de la foto';
  commentsModalList.innerHTML = '';
  commentsModal.classList.add('active');
  setupCommentsListenerForPhoto(getSafePhotoId(currentCommentsPhotoId), commentsModalList);
}

function closeCommentsModal() {
  if (!commentsModal) return;
  commentsModal.classList.remove('active');
  document.body.style.overflow = '';
}

// =====================================================================
// Renderizado de álbumes y galería
// =====================================================================
function renderAlbums() {
  albumsGrid.innerHTML = ALBUMS.map((album) => `
    <article class="album-card" data-album-id="${album.id}" tabindex="0">
      <div class="album-cover">
        ${album.coverImage
          ? `<img src="${album.coverImage}" alt="${escapeHtml(album.name)}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.classList.add('show')">
             <span class="album-icon album-icon-fallback" aria-hidden="true">${album.icon}</span>`
          : `<span class="album-icon" aria-hidden="true">${album.icon}</span>`
        }
      </div>
      <div class="album-info">
        <h3 class="album-name">${escapeHtml(album.name)}</h3>
        <p class="album-count">${album.photos.length} ${album.photos.length === 1 ? 'foto' : 'fotos'}</p>
      </div>
    </article>
  `).join('');

  albumsGrid.querySelectorAll('.album-card').forEach((card) => {
    card.addEventListener('click', () => openAlbum(card.dataset.albumId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAlbum(card.dataset.albumId); }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openAlbum(albumId) {
  currentAlbum = ALBUMS.find(a => a.id === albumId);
  if (!currentAlbum) return;
  currentPhotoIndex = 0;
  galleryTitle.textContent = currentAlbum.name;
  photosGrid.innerHTML = currentAlbum.photos.map((photo, index) => `
    <div class="photo-item" data-index="${index}" tabindex="0">
      <img src="${photo.src}" alt="${escapeHtml(photo.caption || '')}" loading="lazy">
      <div class="photo-actions">
        <button class="btn-like" type="button">
          <span class="heart">❤</span>
          <span class="like-count">0</span>
        </button>
        <button class="btn-comments" type="button">Comentarios</button>
      </div>
      <div class="photo-comments">
        <div class="comments-list"></div>
        <form>
          <input type="text" name="author" placeholder="Tu nombre">
          <textarea name="text" placeholder="Escribe un comentario..." required></textarea>
          <button type="submit">Comentar</button>
        </form>
      </div>
    </div>
  `).join('');

  photosGrid.querySelectorAll('.photo-item').forEach((item) => {
    const index = parseInt(item.dataset.index, 10);
    const photo = currentAlbum.photos[index];
    const img = item.querySelector('img');
    if (img) {
      img.addEventListener('click', () => openLightbox(index));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); }
      });
    }
    initPhotoInteractions(item, photo);
  });

  albumsSection.classList.add('hidden');
  gallerySection.classList.add('visible');
  gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeAlbum() {
  albumsSection.classList.remove('hidden');
  gallerySection.classList.remove('visible');
  currentAlbum = null;
}

// =====================================================================
// Lightbox
// =====================================================================
function openLightbox(index) {
  if (!currentAlbum || !currentAlbum.photos[index]) return;
  currentPhotoIndex = index;
  const photo = currentAlbum.photos[index];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
  lightboxCaption.textContent = photo.caption || '';
  currentZoom = 1; panX = 0; panY = 0;
  applyZoom();
  lightbox.classList.add('active');
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function showPhotoAtIndex(index) {
  if (!currentAlbum) return;
  const len = currentAlbum.photos.length;
  currentPhotoIndex = (index + len) % len;
  const photo = currentAlbum.photos[currentPhotoIndex];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
  lightboxCaption.textContent = photo.caption || '';
  currentZoom = 1; panX = 0; panY = 0;
  applyZoom();
}

btnBack.addEventListener('click', closeAlbum);
lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex - 1));
lightboxNext.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex + 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPhotoAtIndex(currentPhotoIndex - 1);
  if (e.key === 'ArrowRight') showPhotoAtIndex(currentPhotoIndex + 1);
});

lightboxImg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = lightboxImg.getBoundingClientRect();
  const offsetX = e.clientX - (rect.left + rect.width / 2);
  const offsetY = e.clientY - (rect.top + rect.height / 2);
  const dir = e.deltaY < 0 ? 1 : -1;
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + dir * ZOOM_STEP));
  if (newZoom !== currentZoom) {
    const f = newZoom / currentZoom;
    panX = panX * f + offsetX * (1 - f);
    panY = panY * f + offsetY * (1 - f);
    currentZoom = newZoom;
  }
  applyZoom();
});

lightboxImg.addEventListener('dblclick', () => { currentZoom = 1; panX = 0; panY = 0; applyZoom(); });

function startPan(cx, cy) { if (currentZoom <= 1) return; isPanning = true; startClientX = cx; startClientY = cy; startPanX = panX; startPanY = panY; }
function movePan(cx, cy)  { if (!isPanning) return; panX = startPanX + (cx - startClientX); panY = startPanY + (cy - startClientY); applyZoom(); }
function endPan()         { isPanning = false; applyZoom(); }

lightboxImg.addEventListener('mousedown', (e) => { e.preventDefault(); startPan(e.clientX, e.clientY); });
window.addEventListener('mousemove', (e) => movePan(e.clientX, e.clientY));
window.addEventListener('mouseup', endPan);
lightboxImg.addEventListener('touchstart', (e) => { if (e.touches.length === 1) startPan(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
lightboxImg.addEventListener('touchmove',  (e) => { if (e.touches.length === 1) { e.preventDefault(); movePan(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
lightboxImg.addEventListener('touchend', endPan);

// =====================================================================
// Formulario de comentarios
// =====================================================================
if (commentsModalClose) commentsModalClose.addEventListener('click', closeCommentsModal);
if (commentsModal) commentsModal.addEventListener('click', (e) => { if (e.target === commentsModal) closeCommentsModal(); });

if (commentsModalForm) {
  commentsModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window._firestoreDb || !window._firestoreLib || !currentCommentsPhotoId) return;
    const db = window._firestoreDb;
    const { collection, addDoc, serverTimestamp } = window._firestoreLib;
    const author = commentsModalAuthor.value.trim() || 'Anónimo';
    const text   = commentsModalText.value.trim();
    if (!text) return;
    try {
      await addDoc(collection(db, 'comments'), {
        photoId: getSafePhotoId(currentCommentsPhotoId),
        author, text,
        createdAt: serverTimestamp(),
      });
      commentsModalText.value = '';
    } catch (err) {
      console.error('Error guardando comentario', err);
      alert('No se pudo guardar el comentario. Intenta de nuevo.');
    }
  });
}

// =====================================================================
// Arranque: carga tags de Cloudinary y renderiza todo
// =====================================================================
cargarAlbumsDesdeCloudinary();
