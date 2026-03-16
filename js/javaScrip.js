/**
 * Álbum Familiar - Nuestros Recuerdos
 * Puedes editar el array ALBUMS para agregar tus propios álbumes y fotos.
 * Para tus fotos reales: usa rutas como "fotos/cumple-maria/1.jpg" o URLs.
 */

// Todas las imágenes ahora usan URLs de Cloudinary
const ALBUMS = [
  {
    id: 'cumple-maria',
    name: 'Cumpleaños de María',
    coverImage: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634100/KatDennings02_yoyhqd.jpg',
    icon: '🎂',
    photos: [
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634100/KatDennings02_yoyhqd.jpg', caption: 'Fiesta de cumpleaños' },
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634098/KatDennings01_exlgof.jpg', caption: 'Pastel' }      
    ],
  },
  {
    id: 'xv-anos-carla',
    name: 'XV Años de Carla',
    coverImage: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634122/WallFamosas02_mcpmma.jpg',
    icon: '👑',
    photos: [
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634122/WallFamosas02_mcpmma.jpg', caption: 'Fiesta XV años' },
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634119/WallFamosas01_aaqyk9.jpg', caption: 'Decoración' }      
    ],
  },
  {
    id: 'vacaciones-2024',
    name: 'Vacaciones 2024',
    coverImage: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634146/WallFamosas02_jtypkt.jpg',
    icon: '🏖️',
    photos: [
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634146/WallFamosas02_jtypkt.jpg', caption: 'Playa en familia' },
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634143/WallFamosas01_mu31tf.jpg', caption: 'Atardecer' },      
    ],
  },
  {
    id: 'navidad-familia',
    name: 'Navidad en familia',
    coverImage: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634169/WallFamosas02_gmvm7u.jpg',
    icon: '🎄',
    photos: [
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634169/WallFamosas02_gmvm7u.jpg', caption: 'Árbol navideño' },
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634166/WallFamosas01_br6erz.jpg', caption: 'Regalos' }      
    ],
  },
  {
    id: 'boda-hermanos',
    name: 'Boda de los hermanos',
    coverImage: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634191/WallGirl02_pnvm6k.jpg',
    icon: '💒',
    photos: [
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634191/WallGirl02_pnvm6k.jpg', caption: 'Día de la boda' },
      { src: 'https://res.cloudinary.com/dwjzn6n0a/image/upload/v1773634188/WallGirl01_ltkrbt.jpg', caption: 'Familia' },      
    ],
  },
];

const albumsGrid = document.getElementById('albumsGrid');
const gallerySection = document.getElementById('gallerySection');
const albumsSection = document.querySelector('.albums-section');
const photosGrid = document.getElementById('photosGrid');
const galleryTitle = document.getElementById('galleryTitle');
const btnBack = document.getElementById('btnBack');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const commentsModal = document.getElementById('commentsModal');
const commentsModalClose = document.getElementById('commentsModalClose');
const commentsModalTitle = document.getElementById('commentsModalTitle');
const commentsModalList = document.getElementById('commentsModalList');
const commentsModalForm = document.getElementById('commentsModalForm');
const commentsModalAuthor = document.getElementById('commentsModalAuthor');
const commentsModalText = document.getElementById('commentsModalText');

let currentAlbum = null;
let currentPhotoIndex = 0;
let currentZoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let startClientX = 0;
let startClientY = 0;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const commentListenersByPhoto = {};
let currentCommentsPhotoId = null;

function applyZoom() {
  lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
  lightboxImg.style.cursor = currentZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'grab';
}

function getSafePhotoId(photoSrc) {
  // Crea un ID seguro para Firestore a partir de la URL
  return btoa(photoSrc).replace(/\//g, '_');
}

function setupCommentsListenerForPhoto(photoId, commentsListEl) {
  if (!window._firestoreDb || !window._firestoreLib) return;

  const db = window._firestoreDb;
  const { collection, query, where, orderBy, onSnapshot } = window._firestoreLib;

  if (commentListenersByPhoto[photoId]) {
    commentListenersByPhoto[photoId]();
  }

  const commentsRef = collection(db, 'comments');
  const q = query(
    commentsRef,
    where('photoId', '==', photoId),
    orderBy('createdAt', 'asc')
  );

  const unsub = onSnapshot(q, (snapshot) => {
    commentsListEl.innerHTML = '';
    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleString()
        : '';
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
    const data = snap.data();
    const count = data?.count || 0;
    if (likeCountEl) likeCountEl.textContent = count;
  });

  likeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await setDoc(
        likeDocRef,
        { count: increment(1) },
        { merge: true }
      );
    } catch (err) {
      console.error('Error incrementando likes', err);
    }
  });
}

function initPhotoInteractions(photoItemEl, photo) {
  const photoId = photo.src;
  const likeBtn = photoItemEl.querySelector('.btn-like');
  const likeCountEl = photoItemEl.querySelector('.like-count');
  const commentsBtn = photoItemEl.querySelector('.btn-comments');

  if (likeBtn && likeCountEl) {
    setupLikesForPhoto(photoId, likeBtn, likeCountEl);
  }

  if (commentsBtn) {
    commentsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommentsModal(photo);
    });
  }
}

function openCommentsModal(photo) {
  if (!commentsModal || !commentsModalList) return;

  currentCommentsPhotoId = photo.src;
  const safeId = getSafePhotoId(currentCommentsPhotoId);

  commentsModalTitle.textContent = photo.caption || 'Comentarios de la foto';
  commentsModalList.innerHTML = '';
  commentsModal.classList.add('active');

  setupCommentsListenerForPhoto(safeId, commentsModalList);
}

function closeCommentsModal() {
  if (!commentsModal) return;
  commentsModal.classList.remove('active');
  document.body.style.overflow = '';
}

function renderAlbums() {
  albumsGrid.innerHTML = ALBUMS.map((album) => `
    <article class="album-card" data-album-id="${album.id}" tabindex="0">
      <div class="album-cover">
        ${album.coverImage
          ? `<img src="${album.coverImage}" alt="${escapeHtml(album.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.add('show')"><span class="album-icon album-icon-fallback" aria-hidden="true">${album.icon}</span>`
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAlbum(card.dataset.albumId);
      }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openAlbum(albumId) {
  currentAlbum = ALBUMS.find((a) => a.id === albumId);
  if (!currentAlbum) return;

  currentPhotoIndex = 0;
  galleryTitle.textContent = currentAlbum.name;
  photosGrid.innerHTML = currentAlbum.photos
    .map(
      (photo, index) => `
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
  `
    )
    .join('');

  photosGrid.querySelectorAll('.photo-item').forEach((item) => {
    const index = parseInt(item.dataset.index, 10);
    const photo = currentAlbum.photos[index];
    const img = item.querySelector('img');
    if (img) {
      img.addEventListener('click', () => openLightbox(index));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(index);
        }
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

function openLightbox(index) {
  if (!currentAlbum || !currentAlbum.photos[index]) return;
  currentPhotoIndex = index;
  const photo = currentAlbum.photos[index];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
  lightboxCaption.textContent = photo.caption || '';
  currentZoom = 1;
  panX = 0;
  panY = 0;
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
  currentZoom = 1;
  panX = 0;
  panY = 0;
  applyZoom();
}


btnBack.addEventListener('click', closeAlbum);

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex - 1));
lightboxNext.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex + 1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPhotoAtIndex(currentPhotoIndex - 1);
  if (e.key === 'ArrowRight') showPhotoAtIndex(currentPhotoIndex + 1);
});

// Zoom con rueda del ratón y doble clic
lightboxImg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = lightboxImg.getBoundingClientRect();
  const offsetX = e.clientX - (rect.left + rect.width / 2);
  const offsetY = e.clientY - (rect.top + rect.height / 2);

  const zoomDirection = e.deltaY < 0 ? 1 : -1;
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + zoomDirection * ZOOM_STEP));

  if (newZoom !== currentZoom) {
    const zoomFactor = newZoom / currentZoom;
    panX = panX * zoomFactor + offsetX * (1 - zoomFactor);
    panY = panY * zoomFactor + offsetY * (1 - zoomFactor);
    currentZoom = newZoom;
  }
  applyZoom();
});

lightboxImg.addEventListener('dblclick', () => {
  currentZoom = 1;
  panX = 0;
  panY = 0;
  applyZoom();
});

// Arrastrar para mover la imagen cuando hay zoom
function startPan(clientX, clientY) {
  if (currentZoom <= 1) return;
  isPanning = true;
  startClientX = clientX;
  startClientY = clientY;
  startPanX = panX;
  startPanY = panY;
}

function movePan(clientX, clientY) {
  if (!isPanning) return;
  const dx = clientX - startClientX;
  const dy = clientY - startClientY;
  panX = startPanX + dx;
  panY = startPanY + dy;
  applyZoom();
}

function endPan() {
  isPanning = false;
  applyZoom();
}

lightboxImg.addEventListener('mousedown', (e) => {
  e.preventDefault();
  startPan(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
  movePan(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
  endPan();
});

// Soporte táctil (móvil)
lightboxImg.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    startPan(touch.clientX, touch.clientY);
  }
}, { passive: false });

lightboxImg.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    e.preventDefault();
    const touch = e.touches[0];
    movePan(touch.clientX, touch.clientY);
  }
}, { passive: false });

lightboxImg.addEventListener('touchend', () => {
  endPan();
});

if (commentsModalClose) {
  commentsModalClose.addEventListener('click', closeCommentsModal);
}

if (commentsModal) {
  commentsModal.addEventListener('click', (e) => {
    if (e.target === commentsModal) {
      closeCommentsModal();
    }
  });
}

if (commentsModalForm) {
  commentsModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window._firestoreDb || !window._firestoreLib) return;
    if (!currentCommentsPhotoId) return;
    const db = window._firestoreDb;
    const { collection, addDoc, serverTimestamp } = window._firestoreLib;

    const safeId = getSafePhotoId(currentCommentsPhotoId);
    const author = commentsModalAuthor.value.trim() || 'Anónimo';
    const text = commentsModalText.value.trim();
    if (!text) return;

    try {
      await addDoc(collection(db, 'comments'), {
        photoId: safeId,
        author,
        text,
        createdAt: serverTimestamp(),
      });
      commentsModalText.value = '';

      // Añadir el comentario al instante a la lista (optimista)
      const div = document.createElement('div');
      div.className = 'comment-item';
      const now = new Date().toLocaleString();
      div.innerHTML = `
        <div class="comment-item-author">${escapeHtml(author)}</div>
        <div class="comment-item-text">${escapeHtml(text)}</div>
        <div class="comment-item-date">${escapeHtml(now)}</div>
      `;
      commentsModalList.appendChild(div);
      commentsModalList.scrollTop = commentsModalList.scrollHeight;
    } catch (err) {
      console.error('Error guardando comentario', err);
      alert('No se pudo guardar el comentario. Intenta de nuevo.');
    }
  });
}

renderAlbums();
